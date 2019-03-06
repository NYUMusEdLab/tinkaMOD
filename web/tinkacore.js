class TinkaCore {

    // Coming from the Static variable, this might also have a number
    // for when it was added to the array
    constructor(id, characteristics) {
        // Instance Variables
        this.characteristics = characteristics; // noble bluetooth component
        this.id = id;
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

        // https://stackoverflow.com/questions/33859113/
        // javascript-removeeventlistener-not-working-inside-a-class
        self.who_am_i_handler = self.who_am_i.bind(self);

        self.characteristics[0].addEventListener('characteristicvaluechanged',
                                                 self.who_am_i_handler);

        self.characteristics[0].startNotifications().then(function(characteristic) {

            // Clean this up - should use the motor sensor class
            let motor = new Uint8Array([90,171,10,0,0,2,5,0,0,0,0,0]);
            self.characteristics[1].writeValue(motor);
        });

        // If 'self' is not bound here. Then the event itself becomes 'self'

        return true;
    }

    disconnect() {
        this.connected = false;
        TinkaCore.remove_core(this.id);
        return false;
    }

    reconnect(characteristics) {
        let self = this;

        console.log('Reconnecting');
        self.characteristics = characteristics;
        TinkaCore.add_core(this.id);

        self.connect();
        return true;
    }

    connect_sensor(sensor_id) {
        switch (sensor_id) {
            case 1:
                this.sensor = new Button();
                break;
            case 2:
                this.sensor = new Knob();
                break;
            case 3:
                this.sensor = new Slider();
                break;
            case 4:
                this.sensor = new Joystick();
                break;
            case 23:
                this.sensor = new Distance();
                break;
            case 27:
                this.sensor = new Color();
                break;
            default:
                this.sensor = new TinkaSensor();
                console.log('not yet implemented');
        }
        this.sensor_connected = true;
        console.log('Sensor connected: ', this.sensor.name);

        return this.sensor;
    }

    disconnect_sensor() {
        this.sensor_connected = false;
        this.sensor = null;

        console.log('Sensor disconnected');
        return false;
    }

    parse_packet(event) {
        let self = this;
        let packet = new Uint8Array(event.target.value.buffer);

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
                else { self.connect_sensor(new_sensor_id); }
                break;
            default:
                if (!this.sensor_connected) { this.connect_sensor(sensor_id); }
                if (sensor_id != this.sensor.id) { this.connect_sensor(sensor_id); }

                else {
                    let reading = this.sensor.sense(command_id, command);
                    console.log(this.sensor.name + ': ', reading);
                }
        }
    }

    who_am_i(event) {
        let self = this;
        let found = false;
        let packet = new Uint8Array(event.target.value.buffer);

        // We are a motor
        // Motor responds with whether the message succeeded or failed
        if (packet.length == 10) {
            console.log('Motor!');
            found = true;
        }

        // We are a sensor
        else if (packet.length == 13) {
            console.log('TinkaCore!');
            found = true;
        }

        if (found) {
            // self.parse_packet(event);
            self.characteristics[0].removeEventListener('characteristicvaluechanged',
                        self.who_am_i_handler);
            self.characteristics[0].addEventListener('characteristicvaluechanged',
                        self.parse_packet.bind(self));
        }

        return found;
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
