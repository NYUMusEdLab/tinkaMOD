// Generic Library
// (CC)2018-2019 Tinkamo
// Rev 2019-12-22 By Jam Zhang

// Generic Library
GenericLib = {

    // Async function that waits for several seconds before going on 
    wait: function (seconds) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve()
            }, seconds * 1000)
        })
    },

    // Convert a number into a string with fixed digits. Initial "0"s will be added if necessary. Radix definable.
    toFixedInt: function (number, digits, radix) {
        if (isNaN(number) || isNaN(digits)) return
        if (isNaN(radix)) radix = 10
        var s = number.toString(radix)
        while (s.length < digits) s = '0' + s
        return s
    },

    // Algorithm

    // Map a value from the original range to a new one
    // @param value (number) The input value to map
    // @param fromMin, fromMax (number) The original range, inclusive
    // @param toMin, toMax (number) The new range, inclusive
    // @param limitToRange (boolean) If true, limit the output to the new range even if the inout value exceeds the original range. Default = false.
    // return (number) The mapped output value
    mapValue: function (value, fromMin, fromMax, toMin, toMax, limitToRange) {
        var result = toMin + (value - fromMin) / (fromMax - fromMin) * (toMax - toMin);
        if (limitToRange) result = Math.min(Math.max(toMin, toMax), Math.max(Math.min(toMin, toMax), result));
        return result;
    }
}



// System Compatibility Library
Compatibility = {

    // Check for touch device
    isTouchDevice: function () {
        return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    },

    // iOS Version
    iOSVersion: function () {
        // Not working anymore since the deprecation of UIWebView
        // if (/iP(hone|od|ad)/.test(navigator.platform)) {
        // 	// supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
        // 	var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
        // 	return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
        // } else {
        // 	return [-1];
        // }
        if (window.cordova && window.device && device.platform == 'iOS') {
            return device.version.split('.')
        } else {
            return [-1]
        }
    },

    // Check if device support offline speech rebognition
    // iPad Pro and iPhone X support it
    supportOfflineSpeechRecognition: function () {
        if (window.device && device.model) {
            var s = device.model;
            if (s.indexOf('iPad') >= 0) {
                var a = s.substr(4).split(',');
                if (a[0] >= 7 && a[1] >= 3) return true; // 'iPad7,3' is iPad Pro 10'
            }
        }
        return false;
    },

    isInNetEaseApp: function () {
        var inNetEaseApp = false;
        if(navigator.userAgent.indexOf('Safari') == -1)
        {
            inNetEaseApp = true;
        }
        else if(window.extra)
        {
            inNetEaseApp = true;
        }
        else inNetEaseApp = false;

        return inNetEaseApp;
    },

    isiPad: function () {
        if (window.cordova && window.device && device.model && device.model.split) {
            return device.model.split(',')[0] == 'iPad'
        }
    },

    isWeChat: function () {
        return /MicroMessenger/.test(navigator.appVersion)
    },

    isIOS: function () {
        return this.iOSVersion()[0] > 0;
    },

    isAndroid: function () {
        return /Android/.test(navigator.appVersion)
    },

    // Intel x86 Compatibility
    isIntel: function () {
        return /Intel/.test(navigator.platform);
    },

    // Win32 Compatibility
    isWin32: function () {
        return /Win32/.test(navigator.platform);
    },

    // Chrome / Safari Compatibility
    isChromeSafari: function () {
        return /Chrome|Safari/.test(navigator.appVersion);
    },

    // Desktop Chrome browser check
    isDesktopChrome: function () {
        return !window.cordova && /Chrome/.test(navigator.appVersion)
    },

    isDesktopNonChrome: function () {
        return !window.cordova && !/Chrome/.test(navigator.appVersion)
    },

    // Web Audio Compatibility
    supportsWebAudio: function () {
        return typeof(AudioContext) != 'undefined';
    },

    // Cordova Bluetooth Compatibility
    supportsCordovaBluetooth: function () {
        return window.cordova && window.bluetoothle
    },

    // Web Bluetooth Compatibility
    supportsWebBluetooth: function () {
        // return !this.isAndroid && typeof(navigator.bluetooth) !== 'undefined'
        return navigator.bluetooth && navigator.bluetooth.requestDevice
    }
}

// Initializing touch event type
if (Compatibility.isTouchDevice()) {
    Compatibility.touchDownEvent = 'touchstart';
    Compatibility.touchMoveEvent = 'touchmove';
    Compatibility.touchUpEvent = 'touchend';
} else {
    Compatibility.touchDownEvent = 'mousedown';
    Compatibility.touchMoveEvent = 'mousemove';
    Compatibility.touchUpEvent = 'mouseup';
}
