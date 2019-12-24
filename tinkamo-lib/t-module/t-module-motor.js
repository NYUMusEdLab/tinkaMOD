/*
* TModuleMotor Class
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-12-22 By Jam Zhang
*/


// -----------------------------------------------------------------------------
// TModuleMotor Class
// -----------------------------------------------------------------------------

class TModuleMotor extends TModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {};
        super(data, options);
        data.modelName = 'o1'; // String ID of the function module
        data.modelNumber = TModule.MODULE_NUMBER_MOTOR; // Numberic ID of the function module
        window.MOTOR_M = this;
    }

    // Set motor speed for certain seconds
    // @param value [-10, 10]
    // @param seconds (int)
    async setSpeedForSeconds (value, seconds) {

        this.setSpeed(value);
        await wait(seconds);
        this.setSpeed(0);

        function wait(seconds) {
//            console.log('wait');
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve('resolved');
                }, seconds * 1000);
            });
//            console.log('done');
        }

    }

    // Set motor speed instantly
    // @param value [-10, 10]
    setSpeed (value) {

        let instance = this
        // console.log('TMotorModule.setSpeed', value)
        if (this.isDeviceConnected()) {
            if (typeof value == 'boolean') {
                value = value ? 10: 0;
            } else if (isNaN(value)) {
                value = 0;
            } else {
                value = Math.max(-10, Math.min(10, value));
            }
            var power = Math.abs(value);
            if (power < 1) {
                power = 0;
            } else {
                // Power value [0, 1000] according to BLE protocol
                power = Math.round(GenericLib.mapValue(power, 1, 10, TModuleMotor.SPIN_UP_POWER, 1000));
            }
            // console.clear();
            // console.log(value.toFixed(2) + ' -> ' + power);
            let direction = value >= 0 ? TModuleMotor.DIR_CW: TModuleMotor.DIR_CCW
            let v = [direction, power >> 8, power % 0xff]
            instance.write(0, 0, TModuleMotor.COMMAND_SET_MOTOR_POWER, v, true) // Write with verification
        }
    }

}

TModuleMotor.SPIN_UP_POWER = 300 // 26.4% is the spin-up PWM in motor spec. Use 30% because of the extra resistance from the shaft
TModuleMotor.POWER_MAPPING_FACTOR = 4;
TModuleMotor.COMMAND_SET_MOTOR_POWER = 0x00;
TModuleMotor.DIR_CW = 0xFF;
TModuleMotor.DIR_CCW = 0x00;
TModuleMotor.VALIDATING_DELAY = 100; // Validate write command response in 100 ms
