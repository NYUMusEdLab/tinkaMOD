const TinkaSensor = require('./tinkasensor.js');

module.exports = class TinkaCore {

    constructor(peripheral) {
        // Instance Variables
        this.peripheral = peripheral; // noble bluetooth component
        this.id = peripheral.id; // tinkamo id
        this.connected = true;
        this.sensor_connected = false;
        this.sensor = null;

        // Static Variable
        TinkaCore.core_ids = TinkaCore.core_ids || {
            connected: new Set([]),
            disconnected: new Set([])
        }

        TinkaCore.add_core(this.id);
    }

    connect() {
        let self = this;

        self.peripheral.connect(function(error) {
            if(error) {
               console.log(error);
               return;
           }
           // Is their a way to remove this event listener???
            self.peripheral.discoverAllServicesAndCharacteristics(self.listen.bind(self));
        });
        self.connected = true;

        self.peripheral.on('disconnect', self.disconnect);

        return true;
    }

    listen(error, services, characteristics) {
        // self refers to the instance of TinkaCore
        // It must be passed in through bind since this is a callback function
        let self = this;

        if (error) {
            console.log('Error discovering services and characteristics ' + error);
            return;
        }

        let attempt = characteristics[0];

        attempt.subscribe((err) => {
            if (err) {
                console.log('Error subscribing to notifications', err);
            } else {
                console.log('Subscribed to notifications');
            }
        });

        attempt.on('data', (data, isNotification) => {
            let packet = data.toJSON().data; // Convert buffer to JSON
            console.log(packet, packet.length);

            self.parse_packet(packet);
            // let formedMessage = tinkamess.formMessage();
            // console.log(formedMessage);

            /*if (formedMessage.args != false) {
                udpPort.send(formedMessage, localAddr, udpSend);
                //console.log(`Sent message to ${formedMessage.address}`);
            }*/
        });
    }

    disconnect() {
        this.connected = false;
        TinkaCore.remove_core(this.id);
        console.log('disconnected');
        return false;
    }

    connect_sensor(sensor_id) {
        // this.sensor = new TinkaSensor(sensor_id);
        switch (sensor_id) {
            case 1:
                this.sensor = new TinkaSensor.Button();
                break;
            case 2:
                this.sensor = new TinkaSensor.Knob();
                break;
            case 3:
                this.sensor = new TinkaSensor.Slider();
                break;
            case 4:
                this.sensor = new TinkaSensor.Joystick();
                break;
            case 23:
                this.sensor = new TinkaSensor.Distance();
                break;
            case 27:
                this.sensor = new TinkaSensor.Color();
                break;
            default:
                console.log('not yet implemented');
        }
        this.sensor_connected = true;
        return this.sensor;
    }

    disconnect_sensor() {
        this.sensor_connected = false;
        this.sensor = null;
        return false;
    }

    parse_packet(packet) {
        // Correctly formed packets should have at least length 10
        if (packet.length < 10) {
            console.log('Error: Invalid packet length; too short');
            return false;
        }

        let packet_length = packet[2];
        let sensor_id = packet[6];
        let command_id = packet[8];
        let command = packet.slice(9);

        switch (sensor_id) {
            case 0: // Connect/Disconnect
                let new_sensor_id = command[0];
                if (new_sensor_id == 255) { this.disconnect_sensor(); }
                else { this.connect_sensor(new_sensor_id); }
                break;
            default:
                if (!this.sensor_connected) { this.connect_sensor(sensor_id); }
                if (sensor_id != this.sensor.id) { this.connect_sensor(sensor_id); }
                let reading = this.sensor.sense(command_id, command);
                console.log(this.sensor.name + ': ', reading);
        }
    }

    // Static Methods for keeping track globally of
    // what cores we have connected

    static add_core(peripheral_id) {
        // Check if TinkaCore is undefined
        if (TinkaCore.core_ids.disconnected.has(peripheral_id)) {
            TinkaCore.core_ids.disconnected.delete(peripheral_id);
        }
        TinkaCore.core_ids.connected.add(peripheral_id);
        return peripheral_id;
    }

    static remove_core(peripheral_id) {
        TinkaCore.core_ids.connected.delete(peripheral_id);
        TinkaCore.core_ids.disconnected.add(peripheral_id);
        return peripheral_id;
    }
}
