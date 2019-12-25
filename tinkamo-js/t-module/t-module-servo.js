/*
* TModuleServo Class
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-08-22 By Jam Zhang
*/


// -----------------------------------------------------------------------------
// TModuleServo Class
// -----------------------------------------------------------------------------

class TModuleServo extends TModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {};
        if (!data.calibration) data.calibration = [0, 0, 0]
        super(data, options);
        data.modelName = 'o3'; // String ID of the function module
        data.modelNumber = TModule.MODULE_NUMBER_SERVO; // Numberic ID of the function module
        window.SERVO_M = this;
        this.__angle = 0;
    }

    // Set angle of the hardware module
    // @param angle: number/boolean/undefined
    // - number - Angle in degree, typically [-90, 90]
    // - boolean - true = 90. false = -90.
    // - undefined - Power off with firmware 3. Turn to 0 degree with older firmwears.
    // @param raw: boolean - Ignore calibration and pivot to a raw angle
    setAngle (angle, raw) {
        // console.log(angle, raw);
        if (!this.isDeviceConnected()) return;
        if (isNaN(angle)) angle = this.__angle;
        this.__angle = angle;
        switch (this.data.protocolVersion) {
            case 3: // Protocol V3
                if (angle == undefined) {
                    this.rest()
                } else {
                    angle = Math.round(angle + 90)
                    if (angle < 0) angle += 0x10000
                    let hi = (angle>>8)
                    let low = angle - (hi<<8)
                    this.write(0, 0, raw? TModuleServo.COMMAND_SET_RAW_ANGLE: TModuleServo.COMMAND_SET_ANGLE, [hi, low], true) // Must assign a non-zero bufferID to avoid conflict with battery check response
                }
                break
            default: // Protocol V2
                if (angle == undefined) angle = 0
                angle = Math.max(-90, Math.min(90, raw? angle: angle + this.data.calibration[1]))
                this.write(0, 0, TModuleServo.COMMAND_SET_ANGLE, [Math.round(angle + 90)], true) // 8-bit uint as the angle
                break
        }
    }

    // Stop powering the servo motor and cool it down
    rest (forced) {
        if (forced || this.data.protocolVersion >= 3) this.write(0, 0, TModuleServo.COMMAND_REST, [], true) // Write with verification
    }

    // Calibrate the servo with current angle
    // @Param pos: int - Position the calibration point in constant as TModuleServo.CALIBRATE_LEFT
    writeCalibration (pos) {
        // console.log('TModuleServo.writeCalibration()')
        if (this.data.protocolVersion >= 3) this.write(0, 0, TModuleServo.COMMAND_CALIBRATE, [pos], false, true) // Write with verification
    }

    // Reset the calibration values to the default
    resetCalibration () {
        if (this.data.protocolVersion >= 3) this.write(0, 0, TModuleServo.COMMAND_CLEAR_CALIBRATION, []) // Write with verification
    }

}

TModuleServo.COMMAND_SET_ANGLE = 0x00 // Calibrated
TModuleServo.COMMAND_SWING = 0x01
TModuleServo.COMMAND_REST = 0x02
TModuleServo.COMMAND_CALIBRATE = 0x03
TModuleServo.CALIBRATE_LEFT = 0
TModuleServo.CALIBRATE_CENTER = 1
TModuleServo.CALIBRATE_RIGHT = 2
TModuleServo.COMMAND_CLEAR_CALIBRATION = 0x04
TModuleServo.COMMAND_SET_RAW_ANGLE = 0x06 // Uncalibrated
