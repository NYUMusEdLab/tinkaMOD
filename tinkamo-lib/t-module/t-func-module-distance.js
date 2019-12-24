/*
* TFunctionModuleDistance Class
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-09-26 By Jam Zhang
*/

// -----------------------------------------------------------------------------
// TFunctionModuleDistance Class
// -----------------------------------------------------------------------------

class TFunctionModuleDistance extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {};
        super(data, options);
        data.modelNumber = TModule.MODULE_NUMBER_LASER_DISTANCE; // String ID of distance function module
        data.modelName = 'i10'; // Numberic ID of distance function
        window.DISTANCE_M = this;
//        this.stabilizer = new Stabilizer();
    }

    onBLENotify (value) {
        super.onBLENotify(value); // Must call the super method first!
        if (!(value[6]==TModule.MODULE_NUMBER_LASER_DISTANCE && value[8]==0)) return // Only accept distance sensor input command
        var rawValue = ((value[9]<<8) + value[10]);
        console.clear();
        console.log(value[9], value[10], rawValue);
        rawValue = rawValue * TFunctionModuleDistance.RAW_MULTIPLIER + TFunctionModuleDistance.RAW_OFFSET;
        var cm = Math.min(rawValue/TFunctionModuleDistance.INPUT_RANGE * TFunctionModuleDistance.CM_RANGE, TFunctionModuleDistance.CM_RANGE);
        if (isNaN(cm)) return;
        cm = Math.min(TFunctionModuleDistance.MAX_RANGE, Math.max(0, cm)); // Normalize the distance value
        // var value = cm / TFunctionModuleDistance.CM_RANGE * TFunctionModuleDistance.RANGE;
        this.onDistanceChange(cm);
        this.dispatchEvent({type: 'distance', value: cm});
    }

    // Overridable callback on distance change in CM
    // @param cm (number) A floating number in CM
    onDistanceChange (cm) {}
    // onValueChange (value) {}

}

TFunctionModuleDistance.MAX_RANGE = 120; // Up to 150cm
TFunctionModuleDistance.INPUT_RANGE = 12000; // Range within 16376.
TFunctionModuleDistance.CM_RANGE = 120; // Range within 160CM. Default output for all modules is Pandora.preferences.parameterRange (10)
TFunctionModuleDistance.RAW_OFFSET = -80;
TFunctionModuleDistance.RAW_MULTIPLIER = .96;

// Stabilizer (deprecated)
// Is now implemented in the firmware instead of in-app
class Stabilizer {

    constructor (length, threshold) {
        if (isNaN(length)) length = 3;
        if (isNaN(threshold)) threshold = .15;
        this.__log = [];
        this.length = length;
        this.threshold = threshold;
        this.v0 = 0;
        window.STABILIZER = this;
    }

    log (v) {
        this.__log.unshift(v);
        if (this.__log.length > this.length) this.__log.length = this.length;
    }

    value () {
        var sum = 0;
        for (var n in this.__log) sum += this.__log[n];
        var v1 = sum / this.__log.length;
        if (Math.abs(v1 - this.v0) >= this.threshold) {
            this.v0 = v1;
            return v1;
        }
    }

}
