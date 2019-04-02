// TODO - Add Print Mode
/* 
NO LONGER IN USE 
*/ 
class TinkaSensor {
    constructor() {
        this.id = 0;
        this.name = 'unsupported';
        this.return_types = ['i'];
    }

    sense(command_id, command) {
        return 0;
    }

    get_osc_args(command_id, command) {
        let reading = this.sense(command_id, command);
        let args = [];

        if (!reading && !(reading === 0)) { // If false or undefined
            return false;
        }

        for (let i=0; i<this.return_types.length; i++) {
            args.push(
                {
                    type: this.return_types[i],
                    value: reading[i] || reading
                }
            )
        }
        return args;
    }

    get_id() {
        return this.id;
    }

    get_name() {
        return this.name;
    }
}

class Button extends TinkaSensor {
    constructor() {
        super();
        this.id = 1;
        this.name = 'button';
        this.return_types = ['i'];
    }

    sense(command_id, command) {
        let buttonState = command[0];
        return buttonState;
    }
}

class Knob extends TinkaSensor {
    constructor() {
        super();

        this.id = 2;
        this.name = 'knob';
        this.return_types = ['f'];
    }

    sense(command_id, command) {
        let fullNum = create_float(command);

        // Not quite a perfect mapping, but pretty close
        let knobNum = mapToRange(fullNum, 0, 3.45, -10, 10);

        return knobNum;
    }
}

class Slider extends TinkaSensor {
    constructor() {
        super();

        this.id = 3;
        this.name = 'knob';
        this.return_types = ['f'];
    }

    sense(command_id, command) {
        let sliderReading = 255 - command[0];
        let sliderNum = mapToRange(sliderReading, 0, 255, 0, 10);

        return sliderNum;
    }
}

class Joystick extends TinkaSensor {
    constructor() {
        super();

        this.id = 4;
        this.name = 'joystick';
        this.return_types = ['f', 'f'];
    }

    sense(command_id, command) {
        let horizontalInt = command[0];
        let horizontalDec = command[1];
        let verticalInt = command[2];
        let verticalDec = command[3];

        let horizontalIn = horizontalInt + (horizontalDec/255);
        let verticalIn = verticalInt + (verticalDec/255);

        let horizontalNum = mapToRange(horizontalIn, 0, 4, -10, 10);
        let verticalNum = -1 * mapToRange(verticalIn, 0, 4, -10, 10);

        return [horizontalNum, verticalNum];
    }
}

class Distance extends TinkaSensor {
    constructor() {
        super();

        this.id = 23;
        this.name = 'distance';
        this.return_types = ['f'];
    }

    sense(command_id, command) {
        let distNum = create_float(command);

        // distance sensor sends three messages when it gets out of range
        // Right now I am returning false to ignore - could return 120
        if (distNum > 60) {
            return false;
        }

        return distNum;
    }
}

// The color sensor seems like it is bugging out and will periodically flash
// all black... An extra if-statement prevents this problem...
class Color extends TinkaSensor {
    constructor() {
        super();

        this.id = 27;
        this.name = 'color';
        this.return_types = ['i', 'i', 'i'];
    }

    sense(command_id, command) {
        let red = command[0];
        let green = command[1];
        let blue = command[2];
        let brightness = command[3]; // Not used - unsure what it is

        // Hardware bug (feature?) - If all zeros, ignore
        if (!(red + green + blue)) {
            return false;
        }

        return [red, green, blue]
    }
}

// ----------------------Helper Functions----------------------

// Used for sensors which describe a floating point number with two values
function create_float(command) {
    if (command.length != 2) {
        console.log('Create Float function called on incorrect sensor.');
        return false;
    }

    let intNum = command[0];
    let decNum = command[1];
    let fullNum = intNum + (decNum/255);

    return fullNum;
}

// Mapping function that forces new number into final range
function mapToRange(num, in_min, in_max, out_min, out_max) {
    let mappedVal = (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;

    if (mappedVal > out_max) return out_max;
    if (mappedVal < out_min) return out_min;
    return mappedVal;
}
