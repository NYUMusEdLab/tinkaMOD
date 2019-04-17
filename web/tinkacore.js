
/**  ***Class representing a Tinkacore. ***
*Currently Supports: </br>
*   Connection </br>
*       ID: 0  </br>
*       Output: [0|1] string containing name of sensor attached <br>
*   Button
*       ID: 1
*       Output: [0|1]
*   Knob
*       ID: 2
*       Output: float ranging from -10 to 10
*   Slider
*       ID: 3
*       Output: float ranging from 0 to 10
*   Joystick
*       ID: 4
*       Output: horizontal float, vertical float ranging from -10 to 10
*   Distance
*       ID: 23
*       Output: float ranging from 0 to 20
*   Color
*       ID: 27
*       Output: red int, green int, blue int ranging from 0 to 255
*/
class TinkaCore {

    // Coming from the Static variable, this might also have a number
    // for when it was added to the array

    /**
     * Creates an instance of the Tinkacore class
     * @param {number} id
     * @param {*} characteristics
     */
    constructor(id, characteristics) {
        // Instance Variables
        this.characteristics = characteristics; // noble bluetooth component
        this.id = id;
        this.connected = true;
        this.sensor_connected = false;
        this.sensor = null;
        this.reading = {'button': 0};

        // Static Variable
        TinkaCore.core_ids = TinkaCore.core_ids || {
            connected: new Set([]),
            disconnected: new Set([])
        }

        TinkaCore.add_core(this.id);
    }
    /**
     * DESCRIPTION HERE
     * @returns {boolean}
     */
    connect() {
        let self = this;

        // https://stackoverflow.com/questions/33859113/
        // javascript-removeeventlistener-not-working-inside-a-class
        self.who_am_i_handler = self.who_am_i.bind(self);

        self.characteristics[0].addEventListener('characteristicvaluechanged',
                                                 self.who_am_i_handler);

        self.characteristics[0].startNotifications().then(function(characteristic) {

        // Does it make sense to instantiate a new motor instance here?
	    let motor = new Motor();
	    let motorMessage = motor.createSpeedMotorMessage(0,3,0);
            self.characteristics[1].writeValue(motorMessage);
        });

        return true;
    }
    /**
     * DESCRIPTION HERE
     * @returns {boolean}
     */
    disconnect() {
        this.connected = false;
        TinkaCore.remove_core(this.id);
        return false;
    }

    /**
     * DESCRIPTION HERE
     * @param {*} characteristics
     * @returns {boolean}
     */
    reconnect(characteristics) {
        let self = this;

        console.log('Reconnecting');
        self.characteristics = characteristics;
        TinkaCore.add_core(this.id);

        self.connect();
        return true;
    }

    /**
     * DESCRIPTION HERE
     * @param {*} sensor_id
     * @returns {*}
     */
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
        case 5:
            this.sensor = new Motor();
            break;
        case 23:
            this.sensor = new Distance();
            break;
        case 27:
            this.sensor = new Color();
            break;
        default:
            this.sensor = new TinkaTop();
            console.log('not yet implemented');
        }
        this.sensor_connected = true;
        console.log('Sensor connected: ', this.sensor.name);

        return this.sensor;
    }
    /**
     * DESCRIPTION HERE
     * @returns {boolean}
     */
    disconnect_sensor() {
        this.sensor_connected = false;
        this.sensor = null;

        console.log('Sensor disconnected');
        return false;
    }

    /**
     * DESCRIPTION HERE
     * @param {*} event
     * @returns {boolean}
     */
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
                    this.reading[this.sensor.name] = reading;
                    console.log(this.sensor.name + ': ', reading);
                }
        }
    }

    get(sensor_name) {
        return this.reading[sensor_name];
    }

    /**
     * DESCRIPTION HERE
     * @param {*} event
     * @returns {boolean}
     */
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
        // Core responds with a connect/disconnect message (almost)
        else if (packet.length == 13) {
            console.log('TinkaCore!');
            packet[6] = 0; // Swap the 5 with a 0
            found = true;
        }

        if (found) {
            self.parse_packet(event);
            self.characteristics[0].removeEventListener('characteristicvaluechanged',
                        self.who_am_i_handler);

            // If 'self' is not bound here. Then the event itself becomes 'self'
            self.characteristics[0].addEventListener('characteristicvaluechanged',
                        self.parse_packet.bind(self));
        }

        return found;
    }

    // Static Methods for keeping track globally of
    // what cores we have connected
    /**
     * DESCRIPTION HERE
     * @param {*} peripheral_id
     * @returns {*}
     */
    static add_core(peripheral_id) {
        // Check if TinkaCore is undefined
        if (TinkaCore.core_ids.disconnected.has(peripheral_id)) {
            TinkaCore.core_ids.disconnected.delete(peripheral_id);
        }
        TinkaCore.core_ids.connected.add(peripheral_id);
        return peripheral_id;
    }

    /**
     * DESCRIPTION HERE
     * @param {*} peripheral_id
     * @returns {*}
     */
    static remove_core(peripheral_id) {
        TinkaCore.core_ids.connected.delete(peripheral_id);
        TinkaCore.core_ids.disconnected.add(peripheral_id);
        return peripheral_id;
    }


    //handles all kinds of messages
    //only motor message for now
    /**
     * DESCRIPTION HERE
     * @param {*} direction
     * @param {*} intensityInt
     * @param {*} intensityDecimal
     * @returns {*}
     */
    static createMessage(direction, intensityInt, intensityDecimal){
        var motorMessage = new Uint8Array([90,171, 10,0,0,2,5,0,0,direction, intensityInt, intensityDecimal]);
        return motorMessage;
    }

}
