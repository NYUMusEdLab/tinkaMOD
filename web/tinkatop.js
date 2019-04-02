// TODO - Add Print Mode
/** ***Class that represents a TinkaTop***
 */
class TinkaTop {
    /**
     * Creates an instance of the TinkaTop class
     */
    constructor() {
        this.id = 0;
        this.name = 'unsupported';
        this.return_types = ['i'];
    }
    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {number} Always returns 0
     */
    sense(command_id, command) {
        return 0;
    }

    /**
     * DESCRIPTION HERE 
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*} 
     */
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
    /** Get the value of id
     *  @returns {number}
     */
    get_id() {
        return this.id;
    }

    /** Get the value of name
     * @returns {string}
     */
    get_name() {
        return this.name;
    }
}

/**
 * Class representing a Button TinkaTop
 * @extends TinkaTop
 */
class Button extends TinkaTop {
    /**
     * Creates an instance of the Button class
     */
    constructor() {
        super();
        this.id = 1;
        this.name = 'button';
        this.return_types = ['i'];
    }

    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*}
     */
    sense(command_id, command) {
        let buttonState = command[0];
        return buttonState;
    }
}

/**
 * Class representing a Knob TinkaTop
 * @extends TinkaTop
 */
class Knob extends TinkaTop {
    /**
     * Creates an instance of the Knob class
     */
    constructor() {
        super();

        this.id = 2;
        this.name = 'knob';
        this.return_types = ['f'];
    }

    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*}
     */
    sense(command_id, command) {
        let fullNum = create_float(command);

        // Not quite a perfect mapping, but pretty close
        let knobNum = mapToRange(fullNum, 0, 3.45, -10, 10);

        return knobNum;
    }
}

/**
 * Class representing a Slider TinkaTop
 * @extends TinkaTop
 */
class Slider extends TinkaTop {
    /**
     * Creates an instance of the Slider class
     */
    constructor() {
        super();

        this.id = 3;
        this.name = 'knob';
        this.return_types = ['f'];
    }

    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*}
     */
    sense(command_id, command) {
        let sliderReading = 255 - command[0];
        let sliderNum = mapToRange(sliderReading, 0, 255, 0, 10);

        return sliderNum;
    }
}

/**
 * Class representing a Joystick TinkaTop
 * @extends TinkaTop
 */
class Joystick extends TinkaTop {
    /**
     * Creates an instance of the Joystick class
     */
    constructor() {
        super();

        this.id = 4;
        this.name = 'joystick';
        this.return_types = ['f', 'f'];
    }

    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*}
     */
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

/**
 * Class representing a Distance TinkaTop
 * @extends TinkaTop
 */
class Distance extends TinkaTop {
    /**
     * Creates an instance of the Distance class
     */
    constructor() {
        super();

        this.id = 23;
        this.name = 'distance';
        this.return_types = ['f'];
    }

    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*}
     */
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
/**
 * Class representing a Color TinkaTop
 * @extends TinkaTop
 */
class Color extends TinkaTop {
    /**
     * Creates an instance of the Color class
     */
    constructor() {
        super();

        this.id = 27;
        this.name = 'color';
        this.return_types = ['i', 'i', 'i'];
    }

    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*}
     */
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

/**
 * Class representing a Motor TinkaTop
 * @extends TinkaTop
 */
class Motor extends TinkaTop {
    /**
     * Creates an instance of the Motor class
     */
    constructor(){
        super();

        this.id = 5;
        this.name = 'motor';
        this.return_type = ['i', 'f'];

        console.log("THIS WORKS");
    }
       
    /**
     * DESCRIPTION HERE
     * @param {*} command_id 
     * @param {*} command 
     * @returns {*}
     */
    sense(command_id, command){
        let direction = command[0];
        let intensityInt = command[1];
        let intensityDecimal = command[2];
        let intensityFloat = create_float([intensityInt, intensityDecimal]);
        if(intensityFloat != false)
            return [direction, intensityFloat];
    }
    
    /**
     * Creates a message for the motor to return
     * @param {number} direction Represents the direction of the motor, out of 255
     * @param {*} intensityInt The floored integer value of the speed
     * @param {*} intensityDecimal The decimal value of the speed
     * @returns {Uint8Array[number]} The motor message
     */
    createSpeedMotorMessage(direction, intensityInt, intensityDecimal){
        var motorMessage = new Uint8Array([90,171, 10,0,0,2,5,0,0,direction, intensityInt, intensityDecimal]);
        return motorMessage;
    }
}

// ----------------------Helper Functions----------------------

// Used for sensors which describe a floating point number with two values
/**
 * Used to stitch together two numbers to create a float
 * @param {*} command
 * @returns {number} The complete floating point number
 */
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
/**
 * DESCRIPTION HERE
 * @param {*} num 
 * @param {*} in_min 
 * @param {*} in_max 
 * @param {*} out_min 
 * @param {*} out_max
 * @returns {*}  
 */
function mapToRange(num, in_min, in_max, out_min, out_max) {
    let mappedVal = (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;

    if (mappedVal > out_max) return out_max;
    if (mappedVal < out_min) return out_min;
    return mappedVal;
}


