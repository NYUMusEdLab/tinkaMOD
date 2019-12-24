/*
* TFunctionModuleJoystick Class
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-07-10 By Jam Zhang
*/


// -----------------------------------------------------------------------------
// TFunctionModuleJoystick Class
// -----------------------------------------------------------------------------

class TFunctionModuleJoystick extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {}
        // data.isFunctionModule = true
        super(data, options)
        data.modelName = 'i8' // String ID of joystick function module
        data.modelNumber = TModule.MODULE_NUMBER_JOYSTICK // Numberic ID of joystick function module
        window.JOYSTICK_M = this
    }

    onBLENotify (value) {
        super.onBLENotify(value); // Must call the super method first!
        // Output value range [-10, 10]
        // Reversed due to the PCB orientation change March 30 2018
        if (!(value[6]==TModule.MODULE_NUMBER_JOYSTICK && value[8]==0)) return // Only accept joystick input
        var x = (value[9]<<8) + value[10] - TFunctionModuleJoystick.MID_VALUE;
        var y = - ((value[11]<<8) + value[12]) + TFunctionModuleJoystick.MID_VALUE;
        // console.clear();
        // console.log(x + ',' + y);

        // Map x, y to zero and non-zero range
        if (Math.abs(x) < TFunctionModuleJoystick.ZERO_RANGE) {
            x = 0;
        } else {
            if (x > 0) {
                x = mapValue(x, TFunctionModuleJoystick.ZERO_RANGE, TFunctionModuleJoystick.MAX_RANGE, 1, 10, true);
            } else {
                x = mapValue(x, -TFunctionModuleJoystick.ZERO_RANGE, -TFunctionModuleJoystick.MAX_RANGE, -1, -10, true);
            }
        }

        if (Math.abs(y) < TFunctionModuleJoystick.ZERO_RANGE) {
            y = 0;
        } else {
            if (y > 0) {
                y = mapValue(y, TFunctionModuleJoystick.ZERO_RANGE, TFunctionModuleJoystick.MAX_RANGE, 1, 10, true);
            } else {
                y = mapValue(y, -TFunctionModuleJoystick.ZERO_RANGE, -TFunctionModuleJoystick.MAX_RANGE, -1, -10, true);
            }
        }
        this.onJoystickChange(x, y);
    }

    onJoystickChange (x, y) {}

    // Reset output when disconnected
    __onDeviceDisconnect (device) {
        super.__onDeviceDisconnect(device)
        this.onJoystickChange(0, 0);
    }

}

TFunctionModuleJoystick.ZERO_RANGE = 50; // Value within this range from MID_VALUE will be mapped to 0
TFunctionModuleJoystick.MID_VALUE = 512; // Mid value of hardware input
TFunctionModuleJoystick.MAX_RANGE = 400; // Value outside this range from MID_VALUE will be treated as 10 or -10
