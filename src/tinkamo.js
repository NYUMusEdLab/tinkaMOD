// TODO - Support on disconnect callback...
import { TinkaCore } from './tinkacore.js';

/**
* **Class for all Tinkamo**
* Essentially a bucket containing all Tinkamo and functions handling when
* TinkaCores are connected and disconnected to the browser.
*
* There really should only be one instance of Tinkamo per application.
*/
export default class Tinkamo {

    /**
     * Creates an instance of the Tinkamo class.
     */
    constructor() {
        // Static Variables
        Tinkamo.eventTypes = ['*', 'connect', 'disconnect'];

        // Instance Variables
        this.tinkacores = {};
        this.serviceName = 0xfffa;

        this.events = [];

        // Tracking of TinkaCores
        TinkaCore.core_ids = TinkaCore.core_ids || {
            connected: new Set([]),
            disconnected: new Set([])
        }
    }

    /**
     * Primary method for connecting a new TinkaCore to the browser using
     * the Chrome bluetooth api.
     *
     * Due to browser security, this function cannot be called directly,
     * and instead must be a called from user action like pressing a button.
     *
     * @example
     *
     * let tinkamo = new Tinkamo();
     * let connectionButton = document.getElementById('connectionButton');
     * connectionButton.onclick = function() { tinkamo.connect(); }
     */
    connect(){
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
            this._callEventListeners({type: 'connect', tinkacore: tinkacore, tinkamo: this});
            console.log('Optional user callback')
        })
    	.catch(error => {
    	    console.log('Error', error);
    	});
    }

    // ----------- Events -----------

    /**
     * Function allowing the user to define custom event listeners to be called
     * when a Tinkamo instance triggers an event. Events are called in the
     * order with which they were added.
     *
     * eventType must be one of the following:
     * - '*' - connect or disconnect
     * - 'connect'
     * - 'disconnect'
     *
     * @param {string} eventType
     * @param {function} func
     * @param {...*} args
     * @returns {boolean}
     */
    addEventListener(eventType, func, ...args) {
        if (typeof func !== "function") {
            throw "second argument must be a valid function";
            return false;
        }
        if (!Tinkamo.eventTypes.includes(eventType)) {
            throw "event type must be valid"; // list event types
            return false;
        }

        let newEvent = {'eventType': eventType, 'func': func, 'args': args};
        this.events.push(newEvent);
        return true;
    }

    /**
     * Removes a callback function from the events list preventing further calls.
     *
     * @param {string} eventType
     * @param {function} func
     * @returns {boolean}
     */
    removeEventListener(eventType, func) {
        this.events = this.events.filter(ev => (ev.eventType != eventType || ev.func != func));
        return true;
    }

    /**
     * Iterates through the events list and upon ANY TinkaCore event, calls
     * the relevent functions.
     *
     * @param {string} event
     * @returns {boolean}
     * @private
     */
    _callEventListeners(event) {
        for (let evObj of this.events) {
            if (evObj.eventType == '*' || evObj.eventType == event.type)
                evObj.func(event, ...evObj.args);
        }
    }

    // ----------- Getters -----------

    /**
     * Get a list of TinkaCores. By default it returns tinkacores that have
     * been disconnected as well.
     *
     * TinkaCores are listed in the order with which they were originally
     * connected.
     *
     * @param {boolean} [include_disconnected=true]
     * @returns {[Tinkacore]}
     */
    getTinkamoList(include_disconnected=true) {
        let tinkaList = Object.values(this.tinkacores);
        tinkaList.sort((a, b) => a.number - b.number);
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

    /**
     * Creates a new TinkaCore instance and uses TinkaCore functions
     * to ensure it is tracked correctly.
     *
     * @returns {[Tinkacore]}
     * @private
     */
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
    /**
     * Callback function triggered when a TinkaCore is turned off or becomes
     * otherwise disconnectd.
     *
     * @returns {[Tinkacore]}
     * @private
     */
    _on_disconnected(event) {
        let device = event.target;
        let disconnected_id = device.id;

        this.tinkacores[disconnected_id].disconnect();

        this._callEventListeners({type: 'disconnect',
                                  tinkacore: this.tinkacores[disconnected_id],
                                  tinkamo: this});
    }
}
