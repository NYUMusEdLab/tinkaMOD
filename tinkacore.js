const TinkaSensor = require('./tinkasensor.js');

module.exports = class TinkaCore {

    // Coming from the Static variable, this might also have a number
    // for when it was added to the array
    constructor(peripheral, udp) {
        // Instance Variables
        this.peripheral = peripheral; // noble bluetooth component
        this.id = peripheral.id; // tinkamo id
        this.connected = true;
        this.sensor_connected = false;
        this.sensor = null;

        // OSC Variables
        this.send_osc = true;
        this.udp_port = udp.udp_port;
        this.local_address = udp.local_address;
        this.udp_send = udp.udp_send;

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
           // Is there a way to remove this event listener???
            self.peripheral.discoverAllServicesAndCharacteristics(self.listen.bind(self));
        });
        self.connected = true;

        // Only call disconnect once
        self.peripheral.once('disconnect', self.disconnect);

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
            // console.log(packet, packet.length);
            self.parse_packet(packet);
        });
    }

    disconnect() {
        this.connected = false;
        TinkaCore.remove_core(this.id);
        console.log('disconnected');
        return false;
    }

    reconnect(peripheral) {
        this.connected = false;
        this.peripheral = peripheral; // this does not work how we want;
        TinkaCore.add_core(this.id);
        console.log('reconnected');
        return true;
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

        if (this.send_osc) {this.send_on_sensor_change();}

        return this.sensor;
    }

    disconnect_sensor() {
        this.sensor_connected = false;
        this.sensor = null;

        if (this.send_osc) {this.send_on_sensor_change();}
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

                if (this.send_osc) {
                    let osc_args = this.sensor.get_osc_args(command_id, command);
                    let address = this.create_address(this.sensor.name);
                    this.send_udp_message(address, osc_args);
                    console.log(this.sensor.name, ' OSC Message: ', osc_args);
                }
                else {
                    let reading = this.sensor.sense(command_id, command);
                    console.log(this.sensor.name + ': ', reading);
                }
        }
    }

    // OSC Methods
    send_udp_message(address, osc_args) {
        if (osc_args != false) {
            let formed_message = {
                'address': address,
                'args': osc_args
            }
            this.udp_port.send(formed_message,
                this.local_address, this.udp_send);
            return true;
        }
        return false;
    }

    send_on_sensor_change() {
        let current_sensor_name;
        if (this.sensor == null) {current_sensor_name = 'none';}
        else {current_sensor_name = this.sensor.name;}

        let address = this.create_address('connection');
        let args = [
            {
                type: "i",
                value: this.sensor_connected
            },
            {
                type: "s",
                value: current_sensor_name
            }
        ];

        this.send_udp_message(address, args);
    }

    // At some point this may include extra information like a number referring
    // to the Tinkamo Core sending the message
    create_address(address_value) {
        return `/tinkamo/${address_value}`;
    }

    toggle_osc() {
        this.send_osc = !this.send_osc;
        return this.send_osc;
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
