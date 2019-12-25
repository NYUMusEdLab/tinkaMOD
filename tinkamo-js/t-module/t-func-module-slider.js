/*
* TFunctionModuleSlider Class
* Project T-FLOW v0.8
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-07-19 By Jam Zhang
*/


// -----------------------------------------------------------------------------
// TFunctionModuleSlider Class V0.6
// -----------------------------------------------------------------------------

class TFunctionModuleSlider extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {};
        super(data, options);
        data.modelName = 'i3'; // String ID of slider function module
        data.modelNumber = TModule.MODULE_NUMBER_SLIDER; // Numberic ID of slider function module
        window.SLIDER_M = this;
        this.value = 0;
    }

    onBLENotify (value) {
        // console.log('TFunctionModuleSlider ')
        super.onBLENotify(value); // Must call the super method first!
        if (!(value[6]==TModule.MODULE_NUMBER_SLIDER && value[8]==0)) return // Only accept slider input command
        // Reversed due to the PCB orientation change March 30 2018
        this.value = Math.max(0, 1 - value[9] / TFunctionModuleSlider.RAW_DATA_RANGE);
        this.value = Math.pow(this.value, TFunctionModuleSlider.EXP) * Pandora.DEFAULT_PARAMETER_RANGE;
        console.log(value[9], this.value)
        // this.value = Pandora.DEFAULT_PARAMETER_RANGE - Math.max(0, Math.min(Pandora.DEFAULT_PARAMETER_RANGE, value[9] / TFunctionModuleSlider.RAW_DATA_RANGE * (Pandora.DEFAULT_PARAMETER_RANGE + 1) - .5));
        this.onValueChange(this.value); // [0, 10]
        this.dispatchEvent({type: 'move', value: this.value});
        this.dispatchEvent({type: 'moved', value: this.value});
        this.dispatchEvent({type: 'value', value: this.value});
        // console.log('Slider V2 ' + Math.round(value[9]));
    }

    // Overridable callback on slider value change
    onValueChange (v) {}

    // Get the current value
    getValue () {
        return this.value;
    }

}

TFunctionModuleSlider.RAW_DATA_RANGE = 245; // 255 -> 245 to avoid non-zero issue
TFunctionModuleSlider.EXP = .4; // To make unlinear hardware output linear
