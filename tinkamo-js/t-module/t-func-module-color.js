/*
* TFunctionModuleColor Class
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-12-25 By Jam Zhang
*/

// jshint esversion: 8

// -----------------------------------------------------------------------------
// TFunctionModuleColor Class
// -----------------------------------------------------------------------------

class TFunctionModuleColor extends TCoreModule {

    constructor (data, options) {
        // Set model name and number for base class to connect to the right hardware
        if (typeof data != 'object') data = {};
        super(data, options);
        data.modelName = 'i11'; // String ID of color function module
        data.modelNumber = TModule.MODULE_NUMBER_COLOR_LIGHTNESS // Numberic ID of color function module
        data.modelNumberGroup = [TModule.MODULE_NUMBER_COLOR_LIGHTNESS, TModule.MODULE_NUMBER_COLOR_LIGHTNESS_2019] // 2 generations of color sensors have 2 possible model numbers
        window.COLOR_M = this;
    }

    onBLENotify (value) {

        super.onBLENotify(value); // Must call the super method first!
        let modelNumber = value[6]
        let command = value[8]
        
        if (command != 0 || value.length < 17) return // Only accept color sensor input command. Port change command is also 0 but the length is 13.
 
        // Get the raw sensor output
        let a = value[16] // Ambient value
        let f, r0, g0, b0, rgb0, ir, r, g, b, rgb
        r0 = (value.length > 14 ? value[14]: value[9]) // Original Red
        g0 = (value[10]) // Original Green
        b0 = (value[11]) // Original Blue
        rgb0 = (r0<<16) + (g0<<8) + b0 // Original RGB in 6 hex integers
        ir = limit(value.length > 14 ? value[15]: value[12]) // IR value
        // console.clear()
        // console.log('Model', modelNumber, 'RGB', r0, g0, b0)

        // An ambient value < 1 means the sensor is contacting with the object
        // An IR value == 255 means the hardware thinks the sensor is not contacting with the object
        if (a < 1 && ir < 255) {
            // Algorithm A - Deprecated
            // f = TFunctionModuleColor.INTERPOLATION_DATA_201908 // Choose a set off matching factors
            // r = r0 * f.xr + f.dr - a * f.xar // Red value
            // r = limit(255 * Math.pow(r/255, f.pr))
            // g = g0 * f.xg + f.dg - a * f.xag // Green value
            // g = limit(255 * Math.pow(g/255, f.pg))
            // b = b0 * f.xb + f.db - a * f.xab // Blue value
            // b = limit(255 * Math.pow(b/255, f.pb))

            // Algorithm B
            switch (modelNumber) {
                case TModule.MODULE_NUMBER_COLOR_LIGHTNESS_2019: // Late 2019 modle with improved LEDs
                    f = TFunctionModuleColor.INTERPOLATION_DATA_NEW_201911
                    break
                case TModule.MODULE_NUMBER_COLOR_LIGHTNESS: // Early 2019 modle
                    f = TFunctionModuleColor.INTERPOLATION_DATA_OLD_20191129_BY_XUHANG
                    break
            }
            r = Math.round(TFunctionModuleColor.interpolateColor(r0, f.r))
            g = Math.round(TFunctionModuleColor.interpolateColor(g0, f.g))
            b = Math.round(TFunctionModuleColor.interpolateColor(b0, f.b))
            this.currentColor = (r<<16) + (g<<8) + b // Matched 6 hex integers
            let colorData = {
                rgb: this.currentColor,
                rgb0: rgb0,
                r0:r0, g0:g0, b0:b0,
                r:r, g:g, b:b, a:a, ir:ir
            }
            this.dispatchEvent({type: 'color', value: colorData})
            this.onColorChange(colorData)
        } else {
            // The sensor is not in contact with surface. Ignore the output.
            this.currentColor = null
            this.dispatchEvent({type: 'color', value: null})
            this.onColorChange(null)
        }

        // Limit the value to the range of an 1-byte integer
        function limit (v) {
            return Math.min(0xff, Math.max(0, Math.round(v)))
        }

    }

    // Send a null color value when being disconnected
    __onDeviceDisconnect () {
        super.__onDeviceDisconnect();
        this.dispatchEvent({type: 'color', value: null});
        this.onColorChange(null)
    }

    onColorChange (colorData) {}

    // Interpolate sensor raw input values according to the sampled data array
    static interpolateColor (color0, matchingData) {
        if (color0 <= matchingData[0][0]) {
            return matchingData[0][1]
        }
        if (color0 >= matchingData[matchingData.length - 1][0]) {
            return matchingData[matchingData.length - 1][1]
        }
        for (let i = 0; i < matchingData.length -1; i++) {

            if (color0 === matchingData[i][0]) {
                return  matchingData[i][1]
            }
            if (color0 > matchingData[i][0] && color0 < matchingData[i + 1][0]) {
                return (color0 - matchingData[i][0]) / (matchingData[i + 1][0] - matchingData[i][0]) * (matchingData[i + 1][1] - matchingData[i][1]) + matchingData[i][1]
            }

        }
        return 0
    }

}

// Data for Algorithm B - Sample-based interpolation [value, color] ----------------
// template: [[00, 0x00], [01, 0x11], [02, 0x22], [03, 0x33], [04, 0x44], [05, 0x55], [06, 0x66], [07, 0x77], [08, 0x88], [09, 0x99], [10, 0xAA], [11, 0xBB], [12, 0xCC], [13, 0xDD], [14, 0xEE], [15, 0xFF]],

// For late 2019 model with improved LEDs
TFunctionModuleColor.INTERPOLATION_DATA_NEW_201911 = {
    r: [[3.875, 0x00], [4.375, 0x11], [5, 0x22], [5.875, 0x33], [6.875, 0x44], [8, 0x55], [10.5, 0x66], [12.375, 0x77], [15.125, 0x88], [17.5, 0x99], [19.875, 0xAA], [22.625, 0xBB], [25.625, 0xCC], [29.75, 0xDD], [33.25, 0xEE], [36.625, 0xFF]],
    g: [[24.125, 0x00], [25.875, 0x11], [29.375, 0x22], [34.125, 0x33], [40.875, 0x44], [49.25, 0x55], [62, 0x66], [74.375, 0x77], [94.75, 0x88], [107.75, 0x99], [123, 0xAA], [138, 0xBB], [161.375, 0xCC], [186, 0xDD], [213.5, 0xEE], [237.125, 0xFF]],
    b: [[0, 0x00], [0, 0x11], [3.125, 0x22], [12.125, 0x33], [24.5, 0x44], [33.25, 0x55], [44.125, 0x66], [56.25, 0x77], [73.625, 0x88], [88.625, 0x99], [105, 0xAA], [122.25, 0xBB], [147.875, 0xCC], [178.125, 0xDD], [208.375, 0xEE], [239.25, 0xFF]]
}

// For early 2019 model
TFunctionModuleColor.INTERPOLATION_DATA_OLD_20191129_BY_XUHANG = {
    r: [[2.63, 0x00], [2.95, 0x11], [3.37, 0x22], [3.68, 0x33], [4.11, 0x44], [4.37, 0x55], [5.05, 0x66], [5.58, 0x77], [6.16, 0x88], [6.84, 0x99], [8.16, 0xAA], [9.05, 0xBB], [10.42, 0xCC], [12.79, 0xDD], [15.79, 0xEE], [19.84, 0xFF]],
    g: [[19.65, 0x00], [21.45, 0x11], [29.25, 0x22], [31.10, 0x33], [36.35, 0x44], [41.35, 0x55], [47.80, 0x66], [53.35, 0x77], [59.80, 0x88], [68.10, 0x99], [82.15, 0xAA], [91.80, 0xBB], [105.55, 0xCC], [105.55, 0xDD], [160.35, 0xEE], [202.00, 0xFF]],
    b: [[5.16, 0x00], [6.84, 0x11], [18.84, 0x22], [21.32, 0x33], [26.84, 0x44], [33.00, 0x55], [39.74, 0x66], [46.37, 0x77], [53.26, 0x88], [62.74, 0x99], [77.89, 0xAA], [88.16, 0xBB], [104.32, 0xCC], [131.53, 0xDD], [165.63, 0xEE], [212.79, 0xFF]]
}

TFunctionModuleColor.INTERPOLATION_DATA_OLD_20191105 = {
    r: [[2, 0x00], [3, 0x66], [5, 0x99], [6, 0xAA], [7, 0xBB], [8, 0xCC], [9, 0xDD], [10, 0xEE], [11, 0xFF]],
    g: [[13, 0x00], [15, 0x11], [18, 0x22], [21, 0x33], [25, 0x44], [31, 0x55], [39, 0x66], [47, 0x77], [59, 0x88], [68, 0x99], [78, 0xAA], [87, 0xBB], [101, 0xCC], [115, 0xDD], [132, 0xEE], [147, 0xFF]],
    b: [[0, 0x00], [3, 0x33],[19, 0x44], [27, 0x55], [35, 0x66], [46, 0x77], [59, 0x88], [71, 0x99], [85, 0xAA], [100, 0xBB], [121, 0xCC], [146, 0xDD], [170, 0xEE], [200, 0xFF]]
}

TFunctionModuleColor.INTERPOLATION_DATA_OLD_201908 = {
    r: [[0, 0x00], [3, 0x33], [4, 0x55], [5, 0x66], [6, 0x77], [7, 0x99], [9, 0xAA], [10, 0xBB], [12, 0xCC], [14, 0xDD], [16, 0xEE], [17, 0xFF]],
    g: [[21, 0x00], [21, 0x11], [25, 0x22], [29, 0x33], [35, 0x44], [44, 0x55], [55, 0x66], [64, 0x77], [77, 0x88], [91, 0x99], [105, 0xAA], [111, 0xBB], [112, 0xDD], [115, 0xEE], [116, 0xFF]],
    b: [[0, 0x00], [3, 0x33],[19, 0x44], [27, 0x55], [35, 0x66], [46, 0x77], [48, 0x88], [53, 0x99], [56, 0xAA], [58, 0xBB], [63, 0xCC], [68, 0xDD], [71, 0xEE], [73, 0xFF]]
}

TFunctionModuleColor.INTERPOLATION_DATA_OLD_201907 = {
    r: [[0, 0x00], [1, 0x11], [2, 0x44], [3, 0x66], [4, 0x77], [5, 0x88], [6, 0x99], [7, 0xAA], [9, 0xBB], [11, 0xCC], [13, 0xDD], [14, 0xEE], [15, 0xFF]],
    g: [[22, 0x00], [23, 0x11], [26, 0x22], [29, 0x33], [35, 0x44], [44, 0x55], [55, 0x66], [65, 0x77], [78, 0x88], [92, 0x99], [106, 0xAA], [112, 0xBB], [113, 0xCC], [114, 0xDD], [115, 0xEE], [117, 0xFF]],
    b: [[0, 0x00], [11, 0x44], [20, 0x55], [27, 0x66], [36, 0x77], [37, 0x88], [41, 0x99], [44, 0xAA], [45, 0xBB], [49, 0xCC], [53, 0xDD], [56, 0xEE], [58, 0xFF]]
}

// Data for Algorithm A - Reverse exponent function ----------------

// To fix the red deepening bug
TFunctionModuleColor.EXP_MATCHING_DATA_201908 = {
    xr: 21, dr: -21, xar: 0, pr: .72,
    xg: 2.7, dg:-62, xag: 0, pg: .715,
    xb: 4.4, db: 1, xab: 0, pb: .93
}

// For sensors with black shading ring
TFunctionModuleColor.EXP_MATCHING_DATA_201811 = {
    xr: 25, dr: 0, xar: 0, pr: .5, // Amp & delta of Red, amp of Red Ambiemt, Pow
    xg: 1.5, dg: 0, xag: 0, pg: .75, // Amp & delta of Green, amp of Green Ambiemt, Pow
    xb: 2, db: 0, xab: 0, pb: .75 // Amp & delta of Blue, amp of Blue Ambiemt, Pow
}

// For batch 2018-08
TFunctionModuleColor.EXP_MATCHING_DATA_201808 = {
    xr: 13, dr: 0, xar: 0, pr: .5, // Amp & delta of Red, amp of Red Ambiemt, Pow
    xg: 1.1, dg: 0, xag: 0, pg: .75, // Amp & delta of Green, amp of Green Ambiemt, Pow
    xb: 1.6, db: 0, xab: 0, pb: .75 // Amp & delta of Blue, amp of Blue Ambiemt, Pow
}

TFunctionModuleColor.EXP_MATCHING_DATA_201808A = {
    xr: 13, dr: 0, xar: 0, // Amp & delta of Red, amp of Red Ambiemt
    xg: 1.1, dg: 0, xag: 0, // Amp & delta of Green, amp of Green Ambiemt
    xb: 1.8, db: 0, xab: 0 // Amp & delta of Blue, amp of Blue Ambiemt
}

// For batch 2018-07
TFunctionModuleColor.EXP_MATCHING_DATA_201807 = {
    xr: 2, dr: -60, xar: .5, // Amp & delta of Red, amp of Red Ambiemt
    xg: 4.5, dg: -80, xag: .25, // Amp & delta of Green, amp of Green Ambiemt
    xb: 4, db: -30, xab: .25 // Amp & delta of Blue, amp of Blue Ambiemt
}

// For batch 2018-03
TFunctionModuleColor.EXP_MATCHING_DATA_201803 = {
    xr: 1, dr: 0,
    xg: 1, dg: 5,
    xb: 2.3, db: 0
}

TFunctionModuleColor.EXP_MATCHING_DATA_ORIGINAL = {
    xr: 1, dr: 0, xar: 0, pr: 1,
    xg: 1, dg: 0, xag: 0, pg: 1,
    xb: 1, db: 0, xab: 0, pb: 1
}
