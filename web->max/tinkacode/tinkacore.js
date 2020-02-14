import {TinkaTop, Button, Knob, Slider, Joystick, Distance, Color, Motor} from './tinkatop.js';

/**
 * Class representing a Tinkacore.
 * Currently Supports:
 * - Connection
 *     - ID: 0
 *     - Output: [0|1] string containing name of sensor attached
 * - Button
 *     - ID: 1
 *     - Output: [0|1]
 * - Knob
 *     - ID: 2
 *     - Output: float ranging from -10 to 10
 * - Slider
 *     - ID: 3
 *     - Output: float ranging from 0 to 10
 * - Joystick
 *     - ID: 4
 *     - Output: horizontal float, vertical float ranging from -10 to 10
 * - Distance
 *     - ID: 23
 *     - Output: float ranging from 0 to 20
 * - Color
 *     - ID: 27
 *     - Output: red int, green int, blue int ranging from 0 to 255
 */
class TinkaCore {

    /**
     * Creates an instance of the Tinkacore class
     * @param {number} id
     * @param {Object} characteristics
     */
    constructor(id, characteristics) {

        // Static Variables
        TinkaCore.core_ids = TinkaCore.core_ids || {
            connected: new Set([]),
            disconnected: new Set([])
        }
        TinkaCore.number_added = TinkaCore.number_added || 0;

        TinkaCore.eventTypes = ['*', 'sensor change', 'reading', 'button',
                                'knob', 'slider', 'joystick', 'distance',
                                'color'];

        // Instance Variables
        // Bluetooth
        this.characteristics = characteristics;

        // Core
        this.id = id;
        this.number = TinkaCore.number_added;
        this.name = 'tinka' + TinkaCore.number_added;
        this.connected = true;

        // Sensor
        this.sensor_connected = false;
        this.sensor = null;
        this.reading = {};

        // Event Listeners
        // [ {'eventType': eventType, 'func': func, 'args': args} ]
        this.events = [];

        TinkaCore.add_core(this.id);
    }

    // ----------- Connection Methods -----------

    /**
     * Uses the Chrome Bluetooth API to connect the browser to a TinkaCore
     * and begin subsribing to messages sent by the core.
     *
     * In Progress - Sends an initial message to the TinkaCore to determine
     * its top.
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
     * Called when a Tinkacore is turned off or the Bluetooth connection is
     * otherwise lost.
     *
     * At the moment, this function is not meant to be called by the user
     * since it does not stop subscription to sensor messages.
     * @returns {boolean}
     */
    disconnect() {
        this.connected = false;
        TinkaCore.remove_core(this.id);
        return false;
    }

    /**
     * Called when a disconnected sensor is reconnected.
     * At the moment, it simply calls the connect function.
     * @param {Object} characteristics
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
     * Determines a sensor based on the sensor id, the appropriate
     * TinkaTop and instantiates a new TinkaTop instance.
     *
     * Unsupported TinkaTops (e.g. LED Grid) are set to an instance of the
     * of the generic TinkaTop class.
     * @param {number} sensor_id
     * @returns {TinkaTop}
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
     * Called when a TinkaTop is taken off of a TinkaCore.
     * @returns {boolean}
     */
    disconnect_sensor() {
        this.sensor_connected = false;
        this.sensor = null;

        console.log('Sensor disconnected');
        return false;
    }

    // ----------- Sensor Methods -----------

    /**
     * TinkaCores send byte strings of different lengths to indicate an
     * important event like a sensor reading or connection.
     * - (See the protocols folder for more info.)
     *
     * This is the main parser function that unpacks the byte string,
     * interprets its length and meaning, and calls the appropriate functions.
     *
     * User defined event listeners are called here after messages are
     * successfully parsed.
     * @param {Object} event
     * @returns {boolean} - true if interpretable, false otherwise
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

                this._callEventListeners({type: 'sensor change',
                                         sensor: this.getSensorName(),
                                         value: this.sensor_connected,
                                         tinkacore: this});
                break;
            default:
                if (!this.sensor_connected) { this.connect_sensor(sensor_id); }
                if (sensor_id != this.sensor.id) { this.connect_sensor(sensor_id); }

                else {
                    let reading = this.sensor.sense(command_id, command);
                    this.reading[this.sensor.name] = reading;
                    console.log(this.name + ': ' + this.getSensorName() + ': ', reading);

                    // new - Iterate through event list
                    this._callEventListeners({type: 'reading',
                                             sensor: this.getSensorName(),
                                             value: reading,
                                             tinkacore: this});
                }
        }
    }

    /**
     * User called function to request the most recent value picked up by a
     * sensor.
     * - Return type depends on the sensor requested.
     * - False if that sensor has not been used yet.
     * @param {string} sensor_name
     * @returns {number | number[] | false}
     */
    getLastReading(sensor_name) {
        if (this.reading[sensor_name]) {
            return this.reading[sensor_name]
        }
        else { return false; }
    }

    /**
     * Getter for the name of the sensor.
     * @returns {string}
     */
    getSensorName() {
        if (this.sensor_connected) return this.sensor.name;
        else return 'none';
    }

    // ----------- Event Listeners -----------

    /**
     * Function allowing the user to define custom event listeners to be called
     * when a TinkaCore instance triggers an event. Events are called in the
     * order with which they were added.
     *
     * eventType must be one of the following:
     * - '*' - any message sent by a TinkaCore
     * - 'sensor change' - When a tinkatop is removed or added
     * - 'reading' - when any sensor triggers a sensor reading
     * - 'button', 'knob', 'slider', 'joystick', 'distance', 'color'
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
        if (!TinkaCore.eventTypes.includes(eventType)) {
            throw "event type must be valid"; // list event types
            return false;
        }

        // Callbacks are not bound to the TinkaCore
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
            if (
                evObj.eventType == '*' ||
                (evObj.eventType == 'reading' && event.type == 'reading') ||
                (evObj.eventType == event.sensor && event.type == 'reading') ||
                (evObj.eventType == 'sensor change' && event.type == 'sensor change')
            ) {
                evObj.func(event, ...evObj.args);
            }
        }
    }

    /**
     * Function that gets called right when a Tinkacore is first connected and
     * begins subscribing to messages. Determines if it is a motor and what
     * sensor if any is currently connected.
     * @param {Object} event
     * @returns {boolean}
     * @private
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

    // ----------- Static Methods -----------

    /**
     * Keeps track of the Tinkacores that have been added.
     * Adds a TinkaCore ID to the connected set, and removes it from the
     * disconnected set if it has already been connected.
     * @param {string} peripheral_id
     * @returns {string}
     * @private
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
     * Moves a TinkaCore ID from the connected set to the disconnected set.
     * @param {string} peripheral_id
     * @returns {string}
     * @private
     */
    static remove_core(peripheral_id) {
        TinkaCore.core_ids.connected.delete(peripheral_id);
        TinkaCore.core_ids.disconnected.add(peripheral_id);
        return peripheral_id;
    }

    /**
     * In process function - forms and sends a message to a Tinkacore
     * that controls the motor. It can also be used to request the type of
     * TinkaTop indicated in the device's response.
     * @param {number} direction
     * @param {number} intensityInt
     * @param {number} intensityDecimal
     * @returns {number[]}
     */
    static createMessage(direction, intensityInt, intensityDecimal){
        let motorMessage = new Uint8Array([90,171, 10,0,0,2,5,0,0,direction, intensityInt, intensityDecimal]);
        return motorMessage;
    }
}

export { TinkaCore };
