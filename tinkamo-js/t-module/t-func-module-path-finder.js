/*
* TFunctionModulePathFinder Class
* Project T-FLOW v0.7
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-06-16 By Jam Zhang
*/

// -----------------------------------------------------------------------------
// TFunctionModulePathFinder Class
// -----------------------------------------------------------------------------

class TFunctionModulePathFinder extends TCoreModule {

    constructor (data, options) {
        if (isNaN(data.threshold)) data.threshold = TFunctionModulePathFinder.DEFAULT_THRESHOLD;
        super(data, options);
        data.modelName = 'i9'; // String ID of the function module
        data.modelNumber = TModule.MODULE_NUMBER_PATH_FINDER; // Numberic ID of knob function module
        window.PATH_M = this;
        this.previousState = {};
        this.previousTurningState = {left: true, right: false};
    }

    onBLENotify (value) {
        super.onBLENotify(value); // Must call the super method first!
        if (!(value[6]==TModule.MODULE_NUMBER_PATH_FINDER && value[8]==0)) return // Only accept path finder input command
        var left = (value[9]<<8) + value[10];
        var right = (value[11]<<8) + value[12];
        // console.clear();
        // console.log(left + ',' + right);
        left = left / TFunctionModulePathFinder.SENSOR_OUTPUT_RANGE * Pandora.preferences.parameterRange;
        right = right / TFunctionModulePathFinder.SENSOR_OUTPUT_RANGE * Pandora.preferences.parameterRange;
        left = Math.min(Math.floor(left), Pandora.preferences.parameterRange);
        right = Math.min(Math.floor(right), Pandora.preferences.parameterRange);

        if (left!=this.previousLeft || right!=this.previousRight) {

//            console.log('Different');
            // Update data
            this.onRawSensorData(left, right);
            this.previousLeft = left;
            this.previousRight = right;

            // Update status
            var state = {left: left<this.data.threshold, right: right<this.data.threshold};
//            console.log('Status', state, this.previousState);
            if (state.left == this.previousState.left && state.right == this.previousState.right) return;
            this.previousState = $.extend({}, state);
            if (state.left ^ state.right) {
                $.extend(this.previousTurningState, state);
                this.onStatusChange(true, true);
            } else if (state.left && state.right) {
                this.onStatusChange(true, true);
            } else {
                this.onStatusChange(this.previousTurningState.left, this.previousTurningState.right);
            }
        }

    }

    // Overridable callback on raw sensor data change
    // @param left (number) Left sensor data [0, 10] 0=Black 10=White
    // @param right (number) If left sensor data [0, 10] 0=Black 10=White
    onRawSensorData (left, right) {}

    // Overridable callback on boolean status change
    // @param left (boolean) If left sensor is in line
    // @param right (boolean) If left sensor is in line
    onStatusChange (left, right) {}

}

TFunctionModulePathFinder.SENSOR_OUTPUT_RANGE = 300; //1023;
TFunctionModulePathFinder.DEFAULT_THRESHOLD = 5;
