// Willie Payne
// Tinkamo Message Class
/*
    An instance of this class is created everytime the Node server recieves
    a message from a Tinkamo block. Its input is a JSON list created from
    a buffer. Its output is a fully formed OSC message with an address
    referring to a block type, and args referring to its sensor reading.

    Unknown messages have type 'unknown' and an argument 'false'.

    It should be noted that I basically hacked this together from printing
    and deciphering Tinkamo messages sent over Bluetooth. There may be easier
    or more logical ways of using their protocol.
*/

/*
    Data Format
        0: 0x5A
        1: 0xAB
        2: Total packet length minus initial two bytes
        3: N/A
        4: N/A
        5: 0x02
        6: Model ID
        7: N/A
        8: Unique Command ID
        9+: Command
*/

// Currently Supports
/*
     Connection:
        ID: 0
        Output: [0|1], string containing name of sensor attached
     Button:
        ID: 1
        Output: [0|1]
     Knob:
        ID: 2
        Output: float ranging from -10 to 10
     Slider:
        ID: 3
        Output: float ranging from 0 to 10
     Joystick:
        ID: 4
        Output: horizontal float, vertical float ranging from -10 to 10
     Distance:
        ID: 23
        Output: float ranging from 0 to 20
     Color:
        ID: 27
        Output: red int, green int, blue int ranging from 0 to 255
*/

// Class TinkaModule
//  Sensor Connected
// ID
// Message processing functions
// Sensor Class

module.exports = class TinkaMess {

    constructor(data) {
        this.data = data;
        this.type = this.determineType(data);
    }

    /*
        Certain values in the buffer appear to indicate the type of block.
            Input: JSON list
            Output: String referring to object type
    */
    determineType(data) {
        let dLength = data.length;
        let type = 'unknown';
        if (dLength < 6) return type;

        let tinkaKey = data[2]; // Third value holds identity
        let secondKey = data[6];

        switch (tinkaKey) {
            case 8:
                if (secondKey == 1) {
                    type = 'button';
                }
                else if (secondKey == 3) {
                    type = 'slider';
                }
                break;

            case 9:
                if (secondKey == 2) {
                    type = 'knob';
                }
                else if (secondKey == 23) {
                    type = 'distance';
                }

                break;

            case 11:
                secondKey = data[7];
                if (secondKey == 0) {
                    type = 'connection';
                }
                else if (secondKey == 1) {
                    type = 'joystick';
                }
                break;

            case 12:
                type = 'color';
        }
        return type;
    }

    /*
        Based on the message type, trigger the proper parsing method.
            Output: OSC Message where
                address contains the type of object
                args contains a list of type/value pairs or 'false'
    */
    formMessage() {
        let address = `/tinkamo/${this.type}`;
        let args = false;

        switch(this.type) {
            case 'unknown':
                console.log("Unable to send unknown message");
                break;
            case 'connection':
                args = this.parseConnection();
                break;
            case 'button':
                args = this.parseButton();
                break;
            case 'knob':
                args = this.parseKnob();
                break;
            case 'slider':
                args = this.parseSlider();
                break;
            case 'joystick':
                args = this.parseJoystick();
                break;
            case 'distance':
                args = this.parseDistance();
                break;
            case 'color':
                args = this.parseColor();
                break;
            default:
                console.log(`Send not implemented for ${this.type}`);
        }

        let formedMessage = {
            address: address,
            args: args
        };

        return formedMessage;

    }

    parseConnection() {
        // 10th buffer position holds what was connected
        let connectionKey = this.data[9];
        let connectionKeys = {
            1: 'button',
            2: 'knob',
            3: 'slider',
            4: 'joystick',
            23: 'distance',
            27: 'color',
            255: 'none'
        };
        let cBlock = connectionKeys[connectionKey];
        let connectedState = Boolean(cBlock != 'none');

        let args = [
            {
                type: "i",
                value: connectedState
            },
            {
                type: "s",
                value: cBlock
            }
        ];

        console.log(`Connection: ${cBlock}`);
        return args;
    }

    parseButton() {
        let dLength = this.data.length;
        let buttonState = this.data[dLength - 1]; // last val holds state

        let args = [
            {
                type: "i",
                value: buttonState
            }
        ];

        console.log(`Button: ${buttonState}`);
        return args;
    }

    parseKnob() {
        let dLength = this.data.length;
        let intNum = this.data[dLength - 2]; // ranges from 0 to 3
        let decNum = this.data[dLength - 1]; // ranges from 0 to 255
        let fullNum = intNum + (decNum/255);

        // Not quite a perfect mapping, but pretty close
        let knobNum = this.mapToRange(fullNum, 0, 3.45, -10, 10);

        let args = [
            {
                type: "f",
                value: knobNum
            }
        ];
        console.log(`Knob: ${knobNum}`);
        return args;

    }

    parseSlider() {
        // Value ranges from 255 to 0
        let dLength = this.data.length;
        let sliderReading = 255 - this.data[dLength - 1];

        let sliderNum = this.mapToRange(sliderReading, 0, 255, 0, 10);

        let args = [
            {
                type: "f",
                value: sliderNum
            }
        ];
        console.log(`Slider: ${sliderNum}`);
        return args;
    }

    parseJoystick() {
        let dLength = this.data.length;
        let horizontalInt = this.data[dLength - 4];
        let horizontalDec = this.data[dLength - 3];
        let verticalInt = this.data[dLength - 2];
        let verticalDec = this.data[dLength - 1];

        let horizontalIn = horizontalInt + (horizontalDec/255);
        let verticalIn = verticalInt + (verticalDec/255);

        let horizontalNum = this.mapToRange(horizontalIn, 0, 4, -10, 10);
        let verticalNum = -1 * this.mapToRange(verticalIn, 0, 4, -10, 10);

        let args = [
            {
                type: "f",
                value: horizontalNum
            },
            {
                type: "f",
                value: verticalNum
            }
        ];

        console.log(`Horizontal: ${horizontalNum}, Vertical: ${verticalNum},`);
        return args;
    }

    // Right now it is returning a 0 to 20 range. in T-Flow it is 0 to 60
    parseDistance() {
        // last two numbers in the buffer encode distance
        let dLength = this.data.length;
        let intNum = this.data[dLength - 2]; // mostly between 0 and 20
        let decNum = this.data[dLength - 1]; // ranges from 0 to 255
        let distNum = intNum + (decNum/255);

        // Tinkamo sends three messages when it gets out of range
        // Right now I am returning false to ignore - could return 120
        if (distNum > 60) {
            return false;
        }

        let args = [
            {
                type: "f",
                value: distNum
            }
        ];

        console.log(`Distance: ${distNum}`);
        return args;
    }

    parseColor() {
        let dLength = this.data.length;
        let onVal = this.data[dLength - 1];

        // If last value is 0, ignore
        if (!onVal) return false;

        // There are two values after this - not sure what they do
        let red = this.data[9];
        let green = this.data[10];
        let blue = this.data[11];

        let args = [
            {
                type: "i",
                value: red
            },
            {
                type: "i",
                value: green
            },
            {
                type: "i",
                value: blue
            }
        ];

        console.log(`Color: (r: ${red}), (g: ${green}), (b: ${blue})`);
        return args;
    }

    // Mapping function that forces new number into final range
    mapToRange(num, in_min, in_max, out_min, out_max) {
        let mappedVal = (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;

        if (mappedVal > out_max) return out_max;
        if (mappedVal < out_min) return out_min;
        return mappedVal;
    }
}
