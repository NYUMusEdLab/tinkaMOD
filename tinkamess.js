module.exports = class TinkaMess {

    constructor(data) {
        this.data = data;
        this.type = this.determineType(data);
    }

    determineType(data) {
        let dLength = data.length;
        let tinkaKey = data[2]; // Third value holds identity
        let type = 'unknown';

        switch (tinkaKey) {
            case 8:
                type = 'button';
                break;
            case 9:
                type = 'distance';
                break;
            case 11:
                // Both connection joystick have key 11
                let secondKey = data[7];
                if (secondKey == 0) {
                    type = 'connection';
                }
                else if (secondKey == 1) {
                    type = 'joystick';
                }
                else {
                    type = 'unknown';
                }
                break;
            default:
                type = 'unknown';
        }
        return type;
    }

    send() {
        let address = `/tinkamo/${this.type}`;
        let args = [];

        switch(this.type) {
            case 'unknown':
                console.log("Unable to send unknown message");
                return false;
            case 'connection':
                args = this.parseConnection();
                break;
            case 'button':
                args = this.parseButton();
                break;
            case 'distance':
                args = this.parseDistance();
                break;
            default:
                console.log(`Send not implemented for ${this.type}`);
                return false;
        }

        console.log(`Sending message to '${address}'`);

    }

    parseConnection() {
        // 9th buffer position holds what was connected
        let connectionKey = this.data[9];
        let connectionKeys = {
            255: 'none',
            1: 'button',
            23: 'distance',
            4: 'joystick'
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

    parseDistance() {
        // last two numbers in the buffer encode distance
        let dLength = this.data.length;
        let intNum = this.data[dLength - 2];
        let decNum = this.data[dLength - 1]; // ranges from 0 to 255
        let distNum = intNum + (decNum/255);

        // Tinkamo sends three messages when it gets out of range
        if (distNum > 60) {
            distNum = 120; // -1 makes more sense though...
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
}

// idea - random chord that expands
// Multiple sine waves with volume levels
// Adder that shifts entire range.
// Random mode - different chord types
