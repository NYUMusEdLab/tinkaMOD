/*
* TFunctionModuleSound Class
* Project T-FLOW v0.7
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-06-12 By Jam Zhang
*/

// -----------------------------------------------------------------------------
// TFunctionModuleSound Class
// -----------------------------------------------------------------------------

class TFunctionModuleSound extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {};
        super(data, options);
        data.modelName = 'i12'; // String ID of sound function module
        data.modelNumber = TModule.MODULE_NUMBER_SOUND; // Numberic ID of sound function module
        window.SOUND_M = this;
    }

    onBLENotify (value) {
        super.onBLENotify(value); // Must call the super method first!
        if (!(value[6]==TModule.MODULE_NUMBER_SOUND && value[8]==0)) return // Only accept sound input command
        var minLevel = Math.round((value[9]<<8) + value[10]);
        var maxLevel = Math.round((value[11]<<8) + value[12]);
        minLevel = (minLevel - TFunctionModuleSound.MIN_SOUND_LEVEL) / TFunctionModuleSound.SOUND_LEVEL_RANGE * Pandora.DEFAULT_PARAMETER_RANGE;
        maxLevel = (maxLevel - TFunctionModuleSound.MIN_SOUND_LEVEL) / TFunctionModuleSound.SOUND_LEVEL_RANGE * Pandora.DEFAULT_PARAMETER_RANGE;
//        console.log(Math.round(minLevel) + '<br>' + Math.round(maxLevel) + '<br>' + value[9] + ' ' + value[10] + ' ' + value[11] + ' ' + value[12]);
        if (maxLevel - minLevel > 5) this.onSoundLevel(minLevel);
        this.onSoundLevel(maxLevel);
    }

    // Overridable callback on sound level change
    onSoundLevel (level) {}

}

TFunctionModuleSound.MIN_SOUND_LEVEL = 480;
TFunctionModuleSound.MAX_SOUND_LEVEL = 940;
TFunctionModuleSound.SOUND_LEVEL_RANGE = TFunctionModuleSound.MAX_SOUND_LEVEL - TFunctionModuleSound.MIN_SOUND_LEVEL;
TFunctionModuleSound.COMMAND_GET_SOUND_LEVEL = 0x00;
TFunctionModuleSound.COMMAND_SET_NOTIFICATION_THRESHOLD = 0x01;
TFunctionModuleSound.COMMAND_GET_NOTIFICATION_THRESHOLD = 0x02;
