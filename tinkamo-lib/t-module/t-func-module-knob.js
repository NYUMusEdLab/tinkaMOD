/*
* TFunctionModuleKnob Class
* Project T-FLOW v0.7
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-06-12 By Jam Zhang
*/

// -----------------------------------------------------------------------------
// TFunctionModuleKnob Class
// -----------------------------------------------------------------------------

class TFunctionModuleKnob extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {}
        super(data, options)
        data.modelName = 'i2' // String ID of knob function module
        data.modelNumber = TModule.MODULE_NUMBER_KNOB; // Numberic ID of knob function module
        window.KNOB_M = this
    }

    onBLENotify (value) {
        super.onBLENotify(value); // Must call the super method first!
        if (!(value[6]==TModule.MODULE_NUMBER_KNOB && value[8]==0)) return // Only accept knob input command
        var v
        var rawValue = ((value[9]<<8) + value[10])
        // console.clear();
        // console.log('Knob ' + rawValue + ' ' + Math.round(rawValue - TFunctionModuleKnob.MID_RAW_VALUE));
        if (Math.abs(rawValue - TFunctionModuleKnob.MID_RAW_VALUE) < TFunctionModuleKnob.ZERO_RANGE) { // Snap to 0
            // console.log('- Zero');
            v = 0
        } else {
            // console.log('- Non-zero');
            rawValue = Math.min(TFunctionModuleKnob.HALF_RANGE * 2, Math.max(0, rawValue - TFunctionModuleKnob.MIN_RAW_VALUE))
            v = rawValue / TFunctionModuleKnob.HALF_RANGE * 10 - 10
        }
        this.onKnobChange(v)
        this.dispatchEvent({type: 'value', value: v})
    }

    // Overridable callback on knob value change
    onKnobChange (v) {}

}

TFunctionModuleKnob.MID_RAW_VALUE = 572
TFunctionModuleKnob.MIN_RAW_VALUE = 170
TFunctionModuleKnob.HALF_RANGE = TFunctionModuleKnob.MID_RAW_VALUE - TFunctionModuleKnob.MIN_RAW_VALUE
TFunctionModuleKnob.ZERO_RANGE = 50
