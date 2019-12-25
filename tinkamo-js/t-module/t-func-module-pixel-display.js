/*
* TFunctionModulePixelDisplay Class
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-07-25 By Jam Zhang
*/

// -----------------------------------------------------------------------------
// TFunctionModulePixelDisplay Hardware Layer Class
// -----------------------------------------------------------------------------

class TFunctionModulePixelDisplay extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {}
        super(data, options)
        data.modelNumber = TModule.MODULE_NUMBER_LED_MATRIX // String ID of the function module
        data.modelName = 'o5' // Numberic ID of the function module
        var instance = this
        window.PIXELS_M = this

        // Resume image when module is reconnected
        this.addEventListener(TModule.EVENT_CONNECT, onDeviceConnect)
        function onDeviceConnect () {
            setTimeout(function(){
                // console.log('onDeviceConnect', instance.__bmp);
                instance.drawBitmap(instance.__bmp)
            }, 200)
        }
    }

    clear () {
        this.drawBitmap(TFunctionModulePixelDisplay.BITMAP_BLANK)
    }

    // @param color (int) An 8-bit int encoded as 00000RGB
    drawPixel (color, id) {
        var x = id % 5
        var y = Math.floor(id / 5)
        id = (4 - x) * 5 + y
        this.write(TModule.MODULE_NUMBER_LED_MATRIX, this.data.port, TFunctionModulePixelDisplay.COMMAND_DRAW_PIXEL, [id, color])
    }

    // @param bitmap (array of 25 int) The bitmap data of the entire LED matrix
    drawBitmap (bitmap, color) {
        if (!bitmap) return
        this.__bmp = []
        if (isNaN(color)) {
            this.__bmp = bitmap
        } else {
            for (var n in bitmap) {
                this.__bmp[n] = bitmap[n] ? color : 0
            }
        }
        var bmp = this.rotateBitmap(this.__bmp)
        this.write(TModule.MODULE_NUMBER_LED_MATRIX, this.data.port, TFunctionModulePixelDisplay.COMMAND_DRAW_BITMAP, bmp)
    }

    // Rotate the bitmap to match the orientation of the BLE protocol
    rotateBitmap (bitmap) {
        var newBitmap = [];
        for (var x = 0; x < 5; x++) {
            for (var y = 0; y < 5; y++) {
                newBitmap[x*5+y] = bitmap[y*5+4-x]
            }
        }
        return newBitmap
    }

    // @param number (int) Displayble valid number within [-19, 19]
    // @param color (int) A color index number [0, 7]
    drawDigit (number, color) {
        this.drawBitmap(TFunctionModulePixelDisplay.FONT_DIGIT[number], color)
    }

}

TFunctionModulePixelDisplay.COMMAND_DRAW_PIXEL = 0x00;
TFunctionModulePixelDisplay.COMMAND_DRAW_BITMAP = 0x01;
TFunctionModulePixelDisplay.BITMAP_BLANK = [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0];
TFunctionModulePixelDisplay.FONT_DIGIT = [
    [0,7,7,7,0, 7,0,0,0,7, 7,0,0,0,7, 7,0,0,0,7, 0,7,7,7,0], // 0
    [0,0,7,0,0, 0,0,7,0,0, 0,0,7,0,0, 0,0,7,0,0, 0,0,7,0,0], // 1
    [7,7,7,7,0, 0,0,0,0,7, 0,7,7,7,0, 7,0,0,0,0, 7,7,7,7,7], // 2
    [7,7,7,7,0, 0,0,0,0,7, 7,7,7,7,0, 0,0,0,0,7, 7,7,7,7,0], // 3
    [0,0,0,7,0, 0,0,7,7,0, 0,7,0,7,0, 7,7,7,7,7, 0,0,0,7,0], // 4
    [7,7,7,7,7, 7,0,0,0,0, 7,7,7,7,0, 0,0,0,0,7, 7,7,7,7,0], // 5
    [0,7,7,7,7, 7,0,0,0,0, 7,7,7,7,7, 7,0,0,0,7, 0,7,7,7,0], // 6
    [7,7,7,7,7, 0,0,0,7,0, 0,0,7,0,0, 0,0,7,0,0, 0,0,7,0,0], // 7
    [0,7,7,7,0, 7,0,0,0,7, 0,7,7,7,0, 7,0,0,0,7, 0,7,7,7,0], // 8
    [0,7,7,7,0, 7,0,0,0,7, 0,7,7,7,7, 0,0,0,0,7, 7,7,7,7,0], // 9
    [7,0,7,7,7, 7,0,7,0,7, 7,0,7,0,7, 7,0,7,0,7, 7,0,7,7,7], // 10
    [7,0,0,7,0, 7,0,0,7,0, 7,0,0,7,0, 7,0,0,7,0, 7,0,0,7,0], // 11
    [7,0,7,7,7, 7,0,0,0,7, 7,0,7,7,7, 7,0,7,0,0, 7,0,7,7,7], // 12
    [7,0,7,7,7, 7,0,0,0,7, 7,0,7,7,7, 7,0,0,0,7, 7,0,7,7,7], // 13
    [7,0,7,0,7, 7,0,7,0,7, 7,0,7,0,7, 7,0,7,7,7, 7,0,0,0,7], // 14
    [7,0,7,7,7, 7,0,7,0,0, 7,0,7,7,7, 7,0,0,0,7, 7,0,7,7,7], // 15
    [7,0,7,7,7, 7,0,7,0,0, 7,0,7,7,7, 7,0,7,0,7, 7,0,7,7,7], // 16
    [7,0,7,7,7, 7,0,0,0,7, 7,0,0,0,7, 7,0,0,0,7, 7,0,0,0,7], // 17
    [7,0,7,7,7, 7,0,7,0,7, 7,0,7,7,7, 7,0,7,0,7, 7,0,7,7,7], // 18
    [7,0,7,7,7, 7,0,7,0,7, 7,0,7,7,7, 7,0,0,0,7, 7,0,7,7,7], // 19
    [0,0,7,0,0, 0,0,7,0,0, 0,0,7,0,0, 0,0,0,0,0, 0,0,7,0,0], // ! (20 is overflown)
];
TFunctionModulePixelDisplay.BITMAP = [
    [7,7,7,7,7, 7,7,7,7,7, 7,7,7,7,7, 7,7,7,7,7, 7,7,7,7,7], // Fill
    [0,7,7,7,0, 7,7,7,7,7, 7,7,7,7,7, 7,7,7,7,7, 0,7,7,7,0], // White Light
    [0,4,4,4,0, 4,4,4,4,4, 4,4,4,4,4, 4,4,4,4,4, 0,4,4,4,0], // Red Light
    [0,2,2,2,0, 2,2,2,2,2, 2,2,2,2,2, 2,2,2,2,2, 0,2,2,2,0], // Green Light
    [0,6,6,6,0, 6,6,6,6,6, 6,6,6,6,6, 6,6,6,6,6, 0,6,6,6,0], // Blue Light
    [0,7,0,7,0, 0,7,0,7,0, 0,0,0,0,0, 7,0,0,0,7, 0,7,7,7,0], // Smile
    [0,7,0,7,0, 0,7,0,7,0, 0,0,0,0,0, 0,7,7,7,0, 7,0,0,0,7], // Sad
    [0,4,0,4,0, 4,4,4,4,4, 4,4,4,4,4, 0,4,4,4,0, 0,0,4,0,0] // Heart
];
