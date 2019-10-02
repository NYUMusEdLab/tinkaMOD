
/**  ***Class representing a Tinkacore. ***
*Currently Supports:
*   Connection
*       ID: 0
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

import {TinkaTop, Button, Knob, Slider, Joystick, Distance, Color, Motor} from './tinkatop.js';

class TinkaCore {

    // Coming from the Static variable, this might also have a number
    // for when it was added to the array

    /**
     * Creates an instance of the Tinkacore class
     * @param {number} id
     * @param {*} characteristics
     */
    constructor(id, characteristics) {

        // Static Variables
        TinkaCore.core_ids = TinkaCore.core_ids || {
            connected: new Set([]),
            disconnected: new Set([])
        }
        TinkaCore.number_added = TinkaCore.number_added || 0;

        // Instance Variables
        // Bluetooth
        this.characteristics = characteristics;

        // Core
        this.id = id;
        this.name = 'tinka' + TinkaCore.number_added;
        this.connected = true;
        this.sensorChangeFunction = {func:null, args: null};

        // Sensor
        this.sensor_connected = false;
        this.sensor = null;
        this.reading = {};
        this.anyReadingFunction = {func:null, args: null};
        this.readingFunction = {
            'button': {func:null, args: null},
            'knob': {func:null, args: null},
            'slider': {func:null, args: null},
            'joystick': {func:null, args: null},
            'distance': {func:null, args: null},
            'color': {func:null, args: null}
        };

        TinkaCore.add_core(this.id);
    }
    /**
     * DESCRIPTION HERE
     * @returns {boolean}
     */
    connect() {
        let self = this;

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
        this.connected = true;

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

                // Call User-created event listener
                if (this.sensorChangeFunction.func) {
                    this.sensorChangeFunction.func({sensor:this.getSensorName(), connected:this.sensor_connected}, ...this.sensorChangeFunction.args);
                }

                break;
            default:
                if (!this.sensor_connected) { this.connect_sensor(sensor_id); }
                if (sensor_id != this.sensor.id) { this.connect_sensor(sensor_id); }

                else {
                    let reading = this.sensor.sense(command_id, command);
                    this.reading[this.sensor.name] = reading;
                    console.log(this.name + ': ' + this.getSensorName() + ': ', reading);

                    // Call User-created event listeners
                    if (this.anyReadingFunction.func) {
                        this.anyReadingFunction.func({sensor:this.getSensorName(), value:reading}, ...this.anyReadingFunction.args);
                    }
                    if (this.readingFunction[this.getSensorName()].func) {
                        this.readingFunction[this.getSensorName()].func(reading, ...this.readingFunction[this.getSensorName()].args);
                    }
                }
        }
    }

    getLastReading(sensor_name) {
        if (this.reading[sensor_name]) {
            return this.reading[sensor_name]
        }
        else { return false; }
    }

    getSensorName() {
        if (this.sensor_connected) {
            return this.sensor.name;
        }
        else {
            return 'none';
        }
    }


    // Support for Event listeners (at some point this could be refactored)
    onSensorChange(func, ...args) {
        if (typeof func === "function") {
            this.sensorChangeFunction.func = func.bind(this);
            this.sensorChangeFunction.args = args;
            return true;
        }
        else {
            throw "First argument for onSensorChange() must be a function.";
            return false;
        }
    }

    onAnyReading(func, ...args) {
        if (typeof func === "function") {
            this.anyReadingFunction.func = func.bind(this);
            this.anyReadingFunction.args = args;
            return true;
        }
        else {
            throw "First argument for onAnyReading() must be a function.";
            return false;
        }
    }

    onReading(sensorName, func, ...args) {
        if (typeof func === "function") {
            try {
                console.log(this.readingFunction);
                this.readingFunction[sensorName].func = func.bind(this);
                this.readingFunction[sensorName].args = args;
                return true

            } catch (e) {
                throw e;
                throw "Incorrect sensor name provided. Must be 'button', 'knob', 'slider', 'joystick', 'distance', or 'color'";
                return false;
            }
        }
        else {
            throw "First argument for onReading() must be a function.";
            return false;
        }
    }

    /**
     * Function that gets called right when a Tinkacore is first connected and
     * begins subscribing to messages. Determines if it is a motor and what
     * sensor if any is currently connected.
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
        else {
            TinkaCore.number_added += 1;
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

export { TinkaCore };
