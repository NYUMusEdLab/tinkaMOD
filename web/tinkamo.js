// TODO - Support on disconnect callback...
import { TinkaCore } from './tinkacore.js';

export default class Tinkamo {
    constructor() {
        this.tinkacores = {};
        this.serviceName = 0xfffa;

        TinkaCore.core_ids = TinkaCore.core_ids || {
            connected: new Set([]),
            disconnected: new Set([])
        }
    }

    connect(optionalCallback=null, ...args){
        let self = this;
        console.log('Requesting Bluetooth Device...');
        let newDeviceID; // Hold on to the device ID for later
        navigator.bluetooth.requestDevice({
    	filters : [{
    	    name: 'Tinka',
    	}],
    	optionalServices: [self.serviceName]
        })
    	.then(device => {
    	    console.log('> Found ' + device.name);
    	    console.log('> Id: ' + device.id);
    	    console.log('> Connected: ' + device.gatt.connected);

            // In order to maintain Tinkamo as the parent when this is called
            // within the event listener, we must explicitly bind it
            let bound_disconnect = (function(event) {
                self._on_disconnected(event)
            }).bind(self);
    	    device.addEventListener('gattserverdisconnected', bound_disconnect);

            newDeviceID = device.id;
            return device.gatt.connect()
    	})
    	.then(server => {
                console.log(server);
    	    return server.getPrimaryService(self.serviceName);
    	})
    	.then(service => {
                console.log('Tinka services...');
                console.log(service);
                return service.getCharacteristics();
    	})
    	.then(characteristics => {
    	    console.log('Tinka characteristics...');
            return self._add_tinkacore(newDeviceID, characteristics);
    	})
        .then(tinkacore => {
            if (optionalCallback) {
                if (typeof optionalCallback === "function") {
                    optionalCallback(tinkacore, ...args);
                }
            }
            console.log('Optional user callback')
        })
    	.catch(error => {
    	    console.log('Error', error);
    	});
    }

    // ----------- Getters -----------

    /**
     * Get a list of tinkacores. By default it returns tinkacores that have
     * been disconnected as well.
     * @returns {[Tinkacore]}
     */
    getTinkamoList(include_disconnected=true) {
        // This returns disconnected objects as well
        let tinkaList = Object.values(this.tinkacores);
        let fList = tinkaList.filter(t => (include_disconnected || t.connected));
        return fList;
    }

    /**
     * Gets a tinkacore based on its built-in ID
     * @returns {Tinkacore}
     */
    getByID(id) {
        return this.tinkacores[id];
    }

    /**
     * Returns a list of tinkacores with included name.
     * Empty list if the name is not found
     * @returns {[Tinkacore]}
     */
    getByName(name) {
        // We need to decide if names are guaranteed to be unique
        let tinkaList = Object.values(this.tinkacores);
        let tinkaWithName = tinkaList.filter(t => t.name == name);
        return tinkaWithName;
    }

    /**
     * Returns a list of tinkacores with currently attached top.
     * Empty list if none have that top.
     * @returns {[Tinkacore]}
     */
    getBySensor(sensorName) {
        // May want to change the word sensor to top or tinkaTop
        let tinkaList = Object.values(this.tinkacores);
        let tinkaWithSensor = tinkaList.filter(t => t.sensor.name == sensorName);
        return tinkaWithSensor;
    }

    // ----------- Setters -----------

    // Get and set name?

    // Should only be called within connect()
    _add_tinkacore(id, characteristics) {
        if (TinkaCore.core_ids.disconnected.has(id)) {
            this.tinkacores[id].reconnect(characteristics);
        }
        else {
            let newTinkaCore = new TinkaCore(id, characteristics);
            newTinkaCore.connect();
            this.tinkacores[id] = newTinkaCore;
        }

        return this.tinkacores[id];
    }

    // Should only be used as a callback function
    _on_disconnected(event) {
        let device = event.target;
        let disconnected_id = device.id;

        this.tinkacores[disconnected_id].disconnect();
    }
}
