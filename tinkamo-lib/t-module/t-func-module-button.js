/*
* TFunctionModuleButton Hardware Class
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-07-10 By Jam Zhang
*/


// -----------------------------------------------------------------------------
// TFunctionModuleButton Class
// -----------------------------------------------------------------------------

class TFunctionModuleButton extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {};
        super(data, options);
        data.modelName = 'i1'; // String ID of button function module
        data.modelNumber = TModule.MODULE_NUMBER_BUTTON; // Numberic ID of button function module
        window.BUTTON_M = this;
    }

    onBLENotify (value) {
        super.onBLENotify(value); // Must call the super method first!
        // console.log(value[6], value[8]);
        if (!(value[6]==TModule.MODULE_NUMBER_BUTTON && value[8]==0)) return // Only accept button input command
        var v = (value[9] == 1);
//        console.log('Button ', v);
        this.onButtonChange(v)
        this.dispatchEvent({type: 'buttonChange', value: v});
    }

    // Overridable callback on button status change
    onButtonChange (v) {}

    // Reset output when disconnected
    __onDeviceDisconnect (device) {
        super.__onDeviceDisconnect(device)
        this.onButtonChange(false);
    }

}
