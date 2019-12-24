/*
* Bluetooth Abstract Classes
* Compatible with Cordova and Web Bluetooth
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-12-22 By Jam Zhang
*
* Cordova BluetoothLE Plugin
* https://www.npmjs.com/package/cordova-plugin-bluetoothle
* window.bluetoothle.encrypt(function(res){console.log(JSON.stringify(res));}, function(){}, {content:"aaaa"})
*/

// jshint esversion: 6

// -----------------------------------------------------------------------------
// Bluetooth Class
// Interface of bluetooth API on multiple plaforms
// -----------------------------------------------------------------------------

class Bluetooth {

    constructor(onBluetoothInit) {
        if (!Bluetooth.instance)
            Bluetooth.instance = this;
        if (typeof onBluetoothInit != 'function')
            onBluetoothInit = function () { };
        this.onBluetoothInit = onBluetoothInit;
        var instance = this;
        this.options = {};
        // Addresses of currentlly connected devices
        // Usage: connectedDevices[address]
        this.connectedDevices = {};
        // Cordova BluetoothLE plugin
        if (Compatibility.supportsCordovaBluetooth()) {
            console.log('Initializing Cordova BluetoothLE plugin');
            this.isOn = false;
            bluetoothle.initialize((result) => { instance.onBLEInitSuccess(result); }, Bluetooth.onError);
            if (Compatibility.isAndroid()) {
                // Android requires BLE permission verification
                bluetoothle.hasPermission(hasPermissionSuccess, hasPermissionError);
            }
            else {
                // onBluetoothInit(); // Too early to call the success callback
            }
            return;
            function hasPermissionSuccess(result) {
                console.log('bluetoothle.hasPermissionSuccess: ' + JSON.stringify(result));
                if (result && result.hasPermission) {
                    if (!instance.__isInitialized) {
                        instance.__isInitialized = true;
                        onBluetoothInit(); // Callback just for once
                    }
                }
                else {
                    bluetoothle.requestPermission(onBluetoothInit, null);
                }
            }
            function hasPermissionError(result) {
                console.log('bluetoothle.hasPermissionError: ' + JSON.stringify(result));
            }
        }
        // Chrome WebBluetooth
        if (Compatibility.supportsWebBluetooth()) {
            this.isOn = true;
            if (typeof instance.onBLEInitSuccess == 'function')
                instance.onBLEInitSuccess({ status: 'enabled' });
            return;
        }
        if (typeof instance.onBLEInitSuccess == 'function')
            instance.onBLEInitSuccess({ status: 'disabled' });
    }

    static toFixedInt (number, digits, radix) {
        if (isNaN(number) || isNaN(digits)) return
        if (isNaN(radix)) radix = 10
        var s = number.toString(radix)
        while (s.length < digits) s = '0' + s
        return s
    }
    
    // 60: Modules will disappear frequently even when they are nearby the iPad
    // 70: Modules will still be shwon even when they are 1m away from the iPad
    onBLEInitSuccess(result) {
        console.log('Bluetooth.onBLEInitSuccess', result.status);
        var instance = this;
        this.isOn = (result.status == 'enabled');
        // Monitor system BLE status
        if (window.bluetoothle)
            bluetoothle.isEnabled(function (result) { instance.isOn = result.isEnabled; });
        // Bluetooth disabled
        if (!this.isOn) {
            for (var address in this.connectedDevices) {
                if (typeof this.connectedDevices[address] == 'object') {
                    this.connectedDevices[address].isConnected = false;
                    // Invoke callback
                    if (typeof this.connectedDevices[address].options.onDisconnect == 'function') {
                        this.connectedDevices[address].options.onDisconnect();
                    }
                }
                delete this.connectedDevices[address];
            }
        }
        if (!this.__isInitialized) {
            this.__isInitialized = true;
            this.onBluetoothInit(); // Callback just for once
        }
    }
    turnOn() {
        if (!window.bluetoothle)
            return;
        var instance = this;
        bluetoothle.initialize(function (result) {
            instance.onBLEInitSuccess(result);
        }, Bluetooth.onError, {
            request: true,
            restoreKey: 'PandoraApp'
        });
    }
    // Retrieve connected BLE devices
    // Cordova only
    // @param options (Object)
    // - onRetrieve :function(object result) - Callback invoked when the connected device list is retrieved
    // - filterServices :Array of String - Service IDs to filter when scanning
    retrieveConnected(options) {
        // Return if cordova bluetoothle plugin is not found
        if (!window.bluetoothle) {
            if (typeof options.onRetrieve == 'function')
                options.onRetrieve();
            return;
        }
        // Parse options
        if (typeof options == 'undefined')
            options = {};
        if (typeof options.filterServices == 'undefined')
            options.filterServices = Bluetooth.SERVICE_FILTER;
        bluetoothle.retrieveConnected(options.onRetrieve, null, {
            services: options.filterServices
        });
    }
    // Start scanning for bluetooth devices
    // Works only in Cordova BLE mode (cordova-plugin-bluetoothle)
    // @param options (Object)
    // - filterServices (Array of String) Service IDs to filter when scanning
    // - rssiRange (int) A negative int that defines the minimum RSSI value of a qualified device. RSSI roughly refers to the distance of the device. E.g. -30 is closer than -70
    // - timeout (int) Time in milliseconds to stop scanning for power saving. Default = 10000
    // - alwaysOn (boolean) If true, scanning will never end automatically
    startScanning(options) {
        if (!this.isOn || this.isScanning)
            return;
        //    console.log('startScanning');
        var instance = this;
        var devicesFound = 0;
        instance.isScanning = true;
        instance.tempDeviceList = []; // Array of addresses to detect duplication.
        instance.foundDeviceList = [];
        // Check bluetooth capabilities
        if (typeof bluetoothle == 'undefined')
            return;
        // Parse options
        if (typeof options == 'undefined')
            options = {};
        if (typeof options.filterServices == 'undefined')
            options.filterServices = [];
        if (typeof options.timeout == 'undefined')
            options.timeout = 10000;
        if (options.alwaysOn)
            options.timeout = Bluetooth.SCAN_DURATION;
        this.options = options;
        // Timeout the scanning
        this.scanningTimeoutID = setTimeout(onScanningTimeOut, options.timeout);
        // Start scanning
        console.log('startScanning');
        bluetoothle.startScan(onBLEScanSuccess, Bluetooth.onError, { services: options.filterServices });
        function onScanningTimeOut() {
            instance.stopScanning();
            instance.isScanning = false;
            if (options.alwaysOn) {
                instance.scanningTimeoutID = setTimeout(onScanningResume, Bluetooth.SCAN_INTERVAL);
                instance.foundDeviceList = $.extend([], instance.tempDeviceList);
                instance.tempDeviceList = [];
                if (typeof options.onDeviceUpdated == 'function') {
                    options.onDeviceUpdated(instance.foundDeviceList);
                }
            }
        }
        function matchDeviceName(name, initial) {
            if (typeof initial == 'undefined')
                initial = Bluetooth.DEVICE_NAME_INITIAL;
            if (typeof initial == 'string')
                initial = [initial];
            // console.log('matchDeviceName', name, initial);
            name = name.toLowerCase();
            for (var i of initial) {
                // console.log(name + ' <- ' + i);
                if (name && (name.indexOf(i.toLowerCase()) == 0))
                    return true;
            }
            return false;
        }
        function onScanningResume() {
            //        console.log('Scan Resumed');
            bluetoothle.startScan(onBLEScanSuccess, Bluetooth.onError, { services: options.filterServices });
            instance.scanningTimeoutID = setTimeout(onScanningTimeOut, options.timeout);
        }
        function onBLEScanSuccess(result) {
            if (!result)
                return; // Exclude non-Tinkamo devices
            // if (!result || result.name!='Tinka') return; // Exclude non-Tinkamo devices
            // console.log('onBLEScanSuccess', result);
            let mfgDataOffset = Compatibility.isAndroid() ? -2 : 0; // Android adv data has an offset of -2 bytes
            // Protocol V0-V3 portData starts from data[5] and the pogo pin refers to Port address 1. So the valid port data is data[5+1]
            // Protocol V4 portData starts from data[6] byte and the pogo pin refers to Port address 0. So the valid port data is also data[6]
            let portDataOffset = 6;
            switch (result.status) {
                case 'scanStarted':
                    //                console.log('Scanning Bluetooth devices...');
                    break;
                case 'scanResult':
                    // Obtain protocol version
                    // console.log('scanResult ------------------------')
                    result.protocolVersion = 0;
                    result.batchNumber = 0;
                    if (result.advertisement.manufacturerData) {
                        var advData = atob(result.advertisement.manufacturerData);
                        if (advData.length > 5) {
                            result.protocolVersion = advData.charCodeAt(5 + mfgDataOffset);
                        }
                        result.modelNumber = advData.charCodeAt(4 + mfgDataOffset);
                        if (result.protocolVersion <= 3) {
                            // For protocol v2-3, batch number only exists in the 2nd byte which cannot be read by the Android app
                            result.batchNumber = GenericLib.toFixedInt(advData.charCodeAt(1 + mfgDataOffset), 2);
                            if (isNaN(result.batchNumber))
                                result.batchNumber = 1; // In case cordova BLE in Android cannot get the first 2 bytes of the manufacturerData, assume it's the 1st batch.
                        }
                        else {
                            // From protocol v4, batch number is repeated in the 7th byte so the Android app can read it
                            result.batchNumber = GenericLib.toFixedInt(advData.charCodeAt(6 + mfgDataOffset), 2);
                        }
                        result.deviceName = result.advertisement.localName || result.name; // result.name on Android = result.advertisement.localName on iOS
                        result.modelName = Bluetooth.MODEL_NAME_BY_NUMBER[result.modelNumber];
                        // logByteArray(advData); // Log advData
                    }
                    // Fix firmware 2019-07 bugs
                    // Motor V3 always shows protocol version as 2 and localName as MTxxxx
                    // Servo V3 always shows protocol version as 2
                    // They are supposed to be V3 and XX-xxxx while XX = 2-digit hex model number
                    if (result.deviceName) {
                        if (result.deviceName.length > 5) { // In case name contains shortSN
                            result.protocolVersion = 3;
                            if (result.deviceName.length == 6)
                                result.deviceName = result.deviceName.slice(0, 2) + '-' + result.deviceName.slice(2);
                        }
                        else { // In case name is 'Tinka' for the first batch of mass produced modules
                            // result.batchNumber = 1 // Only batch #1 were named as 'Tinka'
                            result.sn = BluetoothDevice.decodeSerialNumber([result.modelNumber, result.batchNumber, advData.charCodeAt(2 + mfgDataOffset), advData.charCodeAt(3 + mfgDataOffset)], result.protocolVersion);
                            result.deviceName = result.sn.substr(result.sn.indexOf('-') + 1);
                        }
                    }
                    // console.log('Protocol Version', result.protocolVersion);
                    // Obtain model info
                    // console.log('result.protocolVersion', result.protocolVersion);
                    switch (result.protocolVersion) {
                        case 2: // Protocol V2 2019/01 - 2019/07
                        case 3: // Protocol V3 2019/08
                        case 4: // Protocol V4 2019/10
                            result.shortSN = result.deviceName.substr(result.deviceName.length - 4);
                            result.sn = GenericLib.toFixedInt(result.modelNumber, 2, 16) + '-' + result.batchNumber + '-' + result.shortSN;
                            break;
                        default: // Protocal V1 deprecated
                            result.modelName = result.deviceName ? result.deviceName.split('-')[1] : '';
                            result.sn = result.address ? result.address.split('-')[0].substr(0, 4) : ''; // Use first segment of BLE address as SN instead of device name
                            break;
                    }
                    if (isCoreModule(result)) { // Core module found
                        console.log('Core', advData);
                        var id = advData.charCodeAt(portDataOffset + mfgDataOffset); // Byte 6-10 = Port value 1-4
                        if (id != 0xff) { // 0xff means no function module connected to the port
                            // Extra attribute for Toolbar to recognize
                            var result = $.extend({}, result);
                            result.isFunctionModule = true;
                            result.port = 0;
                            result.modelNumber = id; // result.functionModuleID = id;
                            result.modelName = Bluetooth.MODEL_NAME_BY_NUMBER[id]; // String
                            // result.name = Bluetooth.SN_INITIAL + result.modelName + '-' + result.sn;
                            result.url = result.deviceName + '/' + 0;
                            instance.addToTempDeviceList(result);
                            devicesFound++;
                            // console.log('Function module '+result.url+' found', instance.tempDeviceList[[result.url]]);
                        }
                    }
                    else { // Standalone module found
                        // console.log('- Standalone');
                        if (matchDeviceName(result.deviceName) && !instance.foundInTempDeviceList(result)) { // Standalone module found
                            // result.deviceName = Bluetooth.SN_INITIAL + result.modelName + '-' + result.sn;
                            result.url = result.deviceName;
                            // console.log('- Matching', result);
                            instance.addToTempDeviceList(result);
                            devicesFound++;
                        }
                    }
                    // console.log(result)
                    break;
            }
            function logByteArray(byteArray) {
                var s = '';
                for (var n = 0; n < byteArray.length; n++) {
                    s += byteArray.charCodeAt(n) + ' ';
                }
                console.log('Scan result', byteArray, s);
            }
        }
        function isWithinRange(rssi) {
            return options.rssiRange ? (rssi > options.rssiRange) : true;
        }
        function isCoreModule(result) {
            return result.modelName == 'c2';
        }
    }
    // @param result:object - The complete BLE scanning result object
    addToTempDeviceList(result) {
        if (!this.foundInTempDeviceList(result))
            this.tempDeviceList.push(result);
    }
    // @param result:object - The complete BLE scanning result object
    foundInTempDeviceList(result) {
        if (!result)
            return;
        for (let device of this.tempDeviceList) {
            if (device.address == result.address)
                return true;
        }
        return false;
    }
    // Instantly remove a device from discovered device list
    removeFromDeviceList(options) {
        if (!options)
            options = {};
        // Remove from the temporary list
        for (var n in this.tempDeviceList) {
            if (options.address) {
                if (this.tempDeviceList[n].address == options.address) {
                    if (typeof this.options.onDeviceLost == 'function') {
                        this.options.onDeviceLost($.extend({}, this.tempDeviceList[n]));
                    }
                    this.tempDeviceList.splice(n, 1);
                }
            }
        }
        // Remove from the persistent list
        for (var n in this.foundDeviceList) {
            if (options.address) {
                if (this.foundDeviceList[n].address == options.address) {
                    this.foundDeviceList.splice(n, 1);
                }
            }
        }
    }
    // Discover and count the available hardware modules.
    // Returns a positive value if nearby devices found in range. A negative value if devices found outside inte range. 0 if no device found.
    // @param options (object)
    // - modelNumber: int - The model number to filter the devices, e.g. 6 (Motor) Default = find all hardware module regardless of model name
    // - possibleModelNumbers: array of int - 
    // - modelName: String - The model string to filter the devices, e.g. 'o1' (Motor) Default = find all hardware module regardless of model name
    // - preferredAddress: String - Usually your previously connected device address. If it is discovered at any distance, it will be treated as a nearby and preferred device.
    // - manualConnection: Boolean - Looking for matching hardware module iat any distance. Default = false
    getConnectableModules(options) {
        //    console.log('Bluetooth.getConnectableModules', modelName);
        if (!Compatibility.supportsCordovaBluetooth()) return -1
        if (!this.foundDeviceList) return 0
        if (!options) options = {}
        if (!options.possibleModelNumbers) options.possibleModelNumbers = [options.modelNumber]
        var totalDevicesFound = 0;
        var nearbyDevicesFound = 0;
        for (var d of this.foundDeviceList) {
            if (!d)
                continue; // Skip if d is undefined
            if (options.possibleModelNumbers instanceof Array) { // Search by modelNumber
                for (let modelNumber of options.possibleModelNumbers) {
                    if (d.modelNumber == modelNumber) {
                        totalDevicesFound++;
                        if (options.manualConnection || Bluetooth.isWithinRange(d.rssi) || d.address == options.preferredAddress)
                            nearbyDevicesFound++;
                    }
                }
            }
            else if (typeof options.modelName == 'string') { // Search by modelName
                if (d.modelName == options.modelName) {
                    totalDevicesFound++;
                    if (options.manualConnection || Bluetooth.isWithinRange(d.rssi) || d.address == options.preferredAddress)
                        nearbyDevicesFound++;
                }
            }
            else { // Search by modelName
                totalDevicesFound++;
                if (options.manualConnection || Bluetooth.isWithinRange(d.rssi) || d.address == options.preferredAddress)
                    nearbyDevicesFound++;
            }
        }
        // console.log('-', nearbyDevicesFound, totalDevicesFound);
        if (nearbyDevicesFound)
            return nearbyDevicesFound;
        if (totalDevicesFound)
            return -totalDevicesFound;
        return 0;
    }
    // Request a device for once to manually connect to
    // In Chrome browser mode, a popup dialog will appear to let you choose a device to connect to
    // In Cordova mode, it will find the nearest matching device to connect to
    // @param possibleModelNumbers: array of int - Possible model numbers to filter the devices in the popup dialog. 2 generations of color sensors with different module numbers are sharing one class.
    // return a Promise with the chosed or matching device.
    requestDevice (possibleModelNumbers) {
        if (Compatibility.supportsWebBluetooth() && !Compatibility.supportsCordovaBluetooth()) {
            if (!(possibleModelNumbers instanceof Array)) possibleModelNumbers = [possibleModelNumbers]
            // console.log('requestDevice - Web Bluetooth mode', modelNumber)
            let params = $.extend({}, Bluetooth.WEB_BLUETOOTH_DEVICE_PARAMS)
            let filters = $.extend([], Bluetooth.WEB_BLUETOOTH_DEVICE_PARAMS.filters)
            for (let modelNumber of possibleModelNumbers) {
                filters.push({ namePrefix: GenericLib.toFixedInt(modelNumber, 2, 16).toUpperCase()})
                filters.push({ namePrefix: Bluetooth.MODEL_NAME_V3A_BY_NUMBER[modelNumber] }) // Compatible with protocol v3a prototypes (deprecated)
            }
            params.filters = filters
            let device = navigator.bluetooth.requestDevice(params)
            // console.log(device)
            return device
        }
        else
            return new Promise(resolve => { resolve(this.findDeviceByModelNumber(possibleModelNumbers, true)); }, reject => { reject('Chrome Web Bluetooth is not available'); });
    }
    // Find a device to connect by various criteria within the scanning result
    // @param deviceCriteria: object - If multiple attributes are given, it will find the devices that match all.
    // - address: string - The BLE address
    // - shortSN: string - The 4-digit serial number
    // - modelNumber: int - The model number to filter the devices, e.g. 5 (Motor). Default = find all Tinkamo modules regardless of model number
    // - possibleModelNumbers: array of int - 
    // @param options (object)
    // - manualConnection (Boolean) Looking for matching hardware module iat any distance. Default = false
    // return: object
    // - The nearest matching device info if found in Cordova mode.
    // - undefined if not found.
    findDevice(deviceCriteria, options) {
        // Look for the best match in scanning results in Cordova mode
        if (Compatibility.supportsCordovaBluetooth()) {
            console.log('findDevice - Cordova Bluetooth mode')
            if (!this.foundDeviceList || !this.foundDeviceList.length) return
            if (!deviceCriteria) deviceCriteria = {}
            if (!options) options = {}
            if (!(deviceCriteria.possibleModelNumbers instanceof Array)) deviceCriteria.possibleModelNumbers = [deviceCriteria.modelNumber]
            var devicesFound = null;
            var maxRSSI = -65535;
            for (var n in this.foundDeviceList) {
                var d = this.foundDeviceList[n];
                if (isMatching(d, deviceCriteria)) {
                    if ((options.manualConnection || Bluetooth.isWithinRange(d.rssi)) && d.rssi >= maxRSSI) {
                        devicesFound = d;
                        maxRSSI = d.rssi;
                    }
                }
            }
            if (devicesFound) {
                if (devicesFound.advertisement)
                    delete devicesFound.advertisement;
                console.log('- Found ', devicesFound);
                return devicesFound;
            }
        }
        function isMatching(deviceData, deviceCriteria) {
            let devicesFound;
            // Priority #1 - Matching address
            if (deviceCriteria.address != undefined) {
                if (deviceData.address == deviceCriteria.address) {
                    devicesFound = deviceData;
                }
                else {
                    return false;
                }
            }
            // Priority #2 - Matching short serial number
            if (deviceCriteria.shortSN != undefined) {
                if (deviceData.shortSN == deviceCriteria.shortSN) {
                    devicesFound = deviceData;
                }
                else {
                    return false;
                }
            }
            // Priority #3 - Matching model number
            if (deviceCriteria.possibleModelNumbers instanceof Array) {
                for (let modelNumber of deviceCriteria.possibleModelNumbers) {
                    if (deviceData.modelNumber == modelNumber) devicesFound = deviceData;
                }
            }
            if (devicesFound)
                return true;
        }
    }
    // Get the advertisement of a BLE device by exact match of the model number, e.g. Motor = 1
    // return The nearest matching device info if found. undefined if not found.
    findDeviceByModelNumber(modelNumber, manualConnection) {
        if (isNaN(modelNumber))
            return;
        var devicesFound = null;
        var maxRSSI = -65535;
        for (var n in this.foundDeviceList) {
            var d = this.foundDeviceList[n];
            if (d.modelNumber == modelNumber) {
                if (manualConnection || (Bluetooth.isWithinRange(d.rssi) && d.rssi >= maxRSSI)) {
                    devicesFound = d;
                    maxRSSI = d.rssi;
                }
            }
        }
        if (devicesFound)
            return devicesFound;
    }
    // Find the nearest available hardware module according to RSSI.
    // Returns the BluetoothDevice instance or null.
    // @param modelName (String) The model string to filter the devices, e.g. 'o1' (Motor)
    findNearestModuleAddress(modelName, preferredAddress) {
        //    console.log('findNearestModuleAddress ', modelName, $.extend({}, this.tempDeviceList));
        var maxRSSI = -65535;
        var address;
        for (var n in this.tempDeviceList) {
            var device = this.tempDeviceList[n];
            //        console.log(device.name.split('-')[1], maxRSSI);
            if (device.modelName == modelName && device.rssi > maxRSSI) {
                address = device.address;
                maxRSSI = device.rssi;
            }
        }
        // Return if found
        if (address) {
            //        console.log(address);
            return address;
        }
        // Search for the previous list in case the current list is purged during a new BLE discovery
        for (var n in this.foundDeviceList) {
            var device = this.foundDeviceList[n];
            //        console.log(device.name.split('-')[1], maxRSSI);
            if (device.modelName == modelName && device.rssi > maxRSSI) {
                address = device.address;
                maxRSSI = device.rssi;
            }
        }
        return address;
    }
    findNearestModuleByModelName(modelName, preferredAddress) {
        console.log('findNearestModuleAddress ', modelName, $.extend({}, this.tempDeviceList));
        var maxRSSI = -65535;
        var nearestDevice;
        for (var n in this.tempDeviceList) {
            var device = this.tempDeviceList[n];
            console.log('-', device.address);
            if (device.modelName == modelName && device.rssi > maxRSSI) {
                nearestDevice = device;
                maxRSSI = device.rssi;
            }
        }
        // Return if found
        if (nearestDevice) {
            console.log(nearestDevice.address);
            return nearestDevice;
        }
        // Search for the previous list in case the current list is purged during a new BLE discovery
        for (var n in this.foundDeviceList) {
            var device = this.foundDeviceList[n];
            //        console.log(device.name.split('-')[1], maxRSSI);
            if (device.modelName == modelName && device.rssi > maxRSSI) {
                nearestDevice = device;
                maxRSSI = device.rssi;
            }
        }
        return nearestDevice;
    }
    // Stop scanning for bluetooth devices
    // Scanning is expensive in resource. You should stop scanning ASAP.
    stopScanning() {
        // Check bluetooth capabilities
        if (!this.isOn)
            return;
        if (typeof bluetoothle == 'undefined')
            return;
        // Clear scanning timeout
        clearTimeout(this.scanningTimeoutID);
        this.scanningTimeoutID = null;
        bluetoothle.stopScan(onBLEScanStopped, onBLEScanStopped);
        function onBLEScanStopped(result) {
            //        console.log(result);
        }
    }
    // Disconnect all modules paired by iOS, especially unused connections remain in iOS
    // @param allDevices (boolean) Disconnect devices being used in editor if true
    disconnectAllDevices(allDevices) {
        if (!this.isOn)
            return;
        var instance = this;
        this.retrieveConnected({
            filterServices: Bluetooth.SERVICE_FILTER,
            onRetrieve: onRetrieveDeviceList
        });
        function onRetrieveDeviceList(result) {
            console.log('disconnectAllDevices - onRetrieveDeviceList', result);
            for (var n in result) {
                var address = result[n].address;
                if (instance.connectedDevices[address]) {
                    instance.connectedDevices[address].disconnect();
                }
                else if (allDevices) {
                    bluetoothle.disconnect(onDisconnectDevice, Bluetooth.onError, { address: address });
                }
            }
        }
        function onDisconnectDevice(result) {
            console.log('disconnectAllDevices - onDisconnectDevice', result);
        }
    }
    static onError(result) {
        // console.log('Bluetooth.onError', result);
    }
    // Check if a BLE device is with range
    // If showHand in on in preferences, range checking will be ignored and always returns true
    static isWithinRange(rssi) {
        // return (!Pandora.preferences.showHand) || rssi >= Bluetooth.RSSI_RANGE;
        // Since Tinkamo V1.1.0, connect-by-range is deprecated. We introduce connect-by-sn instead
        return true;
    }
}


// Tinkamo service and characteristics
Bluetooth.SERVICE_FILTER = ['ffe0']; //['ffe0', 'fffa', 'fffb', 'fffc'];
Bluetooth.NOTIFY_SERVICE = 'fffa';
Bluetooth.NOTIFY_CHARACTERISTIC = 'fffb';
Bluetooth.WRITE_SERVICE = 'fffa';
Bluetooth.WRITE_CHARACTERISTIC = 'fffc';
Bluetooth.DATA_SERVICE = 'ffe0'; // G1 prototype read / write service
//[
//    'ffe0', // G1-G3
//    'fff0', // Brain
//    'fff1' // Brain
//];
Bluetooth.DATA_CHARACTERISTIC = 'ffe1'
Bluetooth.SN_INITIAL = 'T-'
Bluetooth.DEVICE_NAME_INITIAL = [
    'TINKA', // Protocol V2 unified device name 2018/12 - 2019/06
    '00', '01', '02', '03', '04', '05', '06', '07', '0B', '16', '17', '18', '19', '1A', '1B', // Protocol V3 hex model number since 2019/06
    'MT', 'SV', 'CR', 'BT', 'SL', 'KN', 'JS', 'DS', 'CL', 'PF', 'SD', 'PD' // Protocol 3a string model name (deprecated)
] // To filter device name during finding
Bluetooth.DEVICE_NAME_INITIAL_CORE = ['MB-c2']
Bluetooth.MODEL_NAME_V3A_BY_NUMBER = [ // Model names as initial device names for protocol v3a prototypes (deprecated)
    'CR', // 0 Core
    'BT', // 1 Button
    'KN', // 2 Knob
    'SL', // 3 Slider
    'JS', // 4 Joystick
    'MT', // 5 Motor
    'SV', // 6 Pivot Servo
    'MotorDriver', // 7 MotorDriver
    'i5', // 8 IRDistance
    'i4', // 9 Ultrasonic
    'RGBLED', // 10
    'PD', // 11 LEDMatrix
    '', // 12
    'LEDStripe', // 13
    'JoystickStandalone', // 14
    'GPIOStandalone', // 15
    '', // 16
    '', // 17
    '', // 18
    '', // 19
    '', // 20
    '', // 21
    'PF', // 22 PathFinder
    'DS', // 23 LaserDistance
    'i12', // 24
    'Atmosphere', // 25
    'SoilHumidity', // 26
    'CL', // 27 ColorLightness
    'CL', // 28 ColorLightness - Late 2019 model
]
Bluetooth.MODEL_NAME_BY_NUMBER = [
    'c2', // 0 Core
    'i1', // 1 Button
    'i2', // 2 Knob
    'i3', // 3 Slider
    'i8', // 4 Joystick
    'o1', // 5 Motor
    'o3', // 6 Pivot Servo
    'MotorDriver', // 7 MotorDriver
    'i5', // 8 IRDistance
    'i4', // 9 Ultrasonic
    'RGBLED', // 10
    'o5', // 11 LEDMatrix
    '', // 12
    'LEDStripe', // 13
    'JoystickStandalone', // 14
    'GPIOStandalone', // 15
    '', // 16
    '', // 17
    '', // 18
    '', // 19
    '', // 20
    '', // 21
    'i9', // 22 PathFinder
    'i10', // 23 LaserDistance
    'i12', // 24
    'Atmosphere', // 25
    'SoilHumidity', // 26
    'i11', // 27 ColorLightness
    'i11', // 28 ColorLightness - Late 2019 model
]

Bluetooth.WEB_BLUETOOTH_DEVICE_PARAMS = {
    filters: [{ namePrefix: 'Tinka' }],
    optionalServices: [0xfffa],
    uuid: 0xfffa, // 服务UUID
    characteristic: 0xfffc, // 写
    notify: 0xfffb, // 通知
}

// iOS
Bluetooth.SCAN_DURATION = 1500; // 1.5sec per scanning
Bluetooth.SCAN_INTERVAL = 500; // 0.5sec between 2 scanning
Bluetooth.WRITE_INTERVAL = 100; // 0.1sec between 2 writings
//Android
if (Compatibility.isAndroid()) {
    Bluetooth.SCAN_DURATION = 5000; // 5sec per scanning
    Bluetooth.SCAN_INTERVAL = 1000; // 1sec between 2 scanning
    Bluetooth.WRITE_INTERVAL = 100; // 0.1sec between 2 writings
}

BluetoothDevice.WRITE_PACKET_SIZE = 20; // BLE limits each packet to write in 20 bytes. Any data larger than the size should be splited into multiple packets.
BluetoothDevice.WRITE_RETRIES = 4; // Number of retries in case packets lost
BluetoothDevice.MAX_AUTO_RECONNECT_ATTEMPTS = 0; // Retry for 10 times after being passively disconnected
BluetoothDevice.AUTO_RECONNECT_INTERVAL = 1000; // 1 sec betwee nretry

Bluetooth.RSSI_RANGE = -50; // RSSI roughly refers to the distance of the device. E.g. -30 is closer than -70. -200 is almost infinity.





























// -----------------------------------------------------------------------------
// BluetoothDevice Class
// Interface a standalone bluetooth device
// -----------------------------------------------------------------------------



// @param manager (Object) Instance of Bluetooth class. Manager of bluetooth devices.
// @param options (Object)
// - onReady (function(BluetoothDevice instance)) Callback function invoked after services and characteristics are enumerated. Safe to communicate with this callback. The instance of BluetoothDevice will be passed to the callback.
// - onConnectionChange (function(connected: Boolean)) Callback function invoked with connection status when it connects or disconnects
// - onActivelyDisconnect (function()) Callback function invoked when the hardware module actively disconnects
// - connectionData: object
function BluetoothDevice (options) {

    this.manager = Bluetooth.instance;
    // this.address = options.address;
    if (typeof options == 'undefined') options = {};
    this.options = options;
    this.isConnected = false;
    this.buffer = [];
    this.lastWriteTime = [];

    // Connect to it
    this.connect(options);

}

BluetoothDevice.WRITE_TYPE = 'noResponse' // Must be 'noResponse' to work with writeQ() in Android. Default '' mode with response will cause very slow writeQ() in Android

// Connect to the device
// Compatible with Cordova and Web Bluetooth
// @param options: object
// - onError: function(error) - Callback on error
// - connectionData: object - Optional data to connect to the device
// -- address: string - Cordova Bluetooth address
// -- device: object - Chrome Web Bluetooth device instance
BluetoothDevice.prototype.connect = function (options) {

    if (!options) options = {}
    this.options = options
    if (!(this.manager.isOn && options && options.connectionData)) return
    if (!options.onError) options.onError = Bluetooth.onError
    let instance = this
    delete this.isActivelyDisconnected

    if (Compatibility.supportsCordovaBluetooth()) {
        // Cordova Bluetooth
        // console.log('BluetoothDevice.connect', options.connectionData.address)
        if (options.connectionData.address) {
            // Instanlty remove the device in discovered device list
            this.manager.removeFromDeviceList({address: options.connectionData.address})
            // To really connect to a previously closed device in iOS 10, only reconnect() works
            bluetoothle.reconnect(onCordovaBLEConnect, Bluetooth.onError, {address: options.connectionData.address})
            bluetoothle.connect(onCordovaBLEConnect, Bluetooth.onError, {address: options.connectionData.address})
        }
    } else if (Compatibility.supportsWebBluetooth()) {
        // Web Bluetooth
        if (options.connectionData.device) {
            // this.connectionData = options.connectionData
            if (!this.__chromeGATTServerEventListener) this.__chromeGATTServerEventListener = function () {
                // console.log('gattserverdisconnected')
                instance.isConnected = false
                instance.__chromeGATTDevice.removeEventListener('gattserverdisconnected', instance.__chromeGATTServerEventListener)
                if (typeof options.onDisconnect == 'function') {
                    options.onDisconnect(instance)
                }
                if (instance.isActivelyDisconnected && typeof options.onActivelyDisconnect == 'function') {
                    options.onActivelyDisconnect(instance)
                }
                delete instance.__chromeGATTDevice
                // instance.options.connectionData.device.gatt.connect()
            }
            // if (!this.__chromeGATTDevice)
            if (this.__chromeGATTDevice != options.connectionData.device) {
                if (this.__chromeGATTDevice) {
                    if (this.__chromeGATTDevice.gatt) this.__chromeGATTDevice.gatt.disconnect()
                    if (this.__chromeGATTDevice.removeEventListener) this.__chromeGATTDevice.removeEventListener('gattserverdisconnected', this.__chromeGATTServerEventListener)
                }
                // this.__chromeGATTDevice.gatt.disconnect()
                // this.__chromeGATTDevice.removeEventListener('gattserverdisconnected', this.__chromeGATTServerEventListener)
                window.GATT_DEVICE = options.connectionData.device
                this.__chromeGATTDevice = options.connectionData.device
                if (this.__chromeGATTDevice.addEventListener) {
                    this.__chromeGATTDevice.addEventListener('gattserverdisconnected', this.__chromeGATTServerEventListener)
                    // console.log('connectionData.device.gatt.connect()', this.__chromeGATTDevice)
                    // Connect via Web Bluetooth and enumerate the services and characteristics to write and notify
                    this.__chromeGATTDevice.gatt.connect()
                    .then(server => {
                        if (server.device != this.__chromeGATTDevice) {
                            // console.error('gatt.onConnect device mismatch', server.device, this.__chromeGATTDevice)
                            server.disconnect()
                            return Promise.reject(server)
                        }
                        // console.error('gatt.onConnect', server)
                        this.__chromeBLEServer = server
                        return server.getPrimaryService(parseInt(Bluetooth.WRITE_SERVICE, 16))
                    }).then(service => {
                        // console.log('- service', service);
                        if (typeof options.onDeviceConnect == 'function') options.onDeviceConnect(this) // When BLE is connected, the callback will stop repeating connecting
                        this.__chromeWriteService = service
                        return service.getCharacteristic(parseInt(Bluetooth.WRITE_CHARACTERISTIC, 16))
                    }).then(characteristic => {
                        // console.log('- characteristic', characteristic);
                        this.__chromeWriteCharacteristic = characteristic
                        return this.__chromeBLEServer.getPrimaryService(parseInt(Bluetooth.NOTIFY_SERVICE, 16))
                    }).then(service => {
                        // console.log('- service', service);
                        this.__chromeNotifyService = service
                        return service.getCharacteristic(parseInt(Bluetooth.NOTIFY_CHARACTERISTIC, 16))
                    }).then(characteristic => {
                        // console.log('- characteristic', characteristic);
                        this.__chromeNotifyCharacteristic = characteristic
                        this.isConnected = true;
                        if (typeof options.onReady == 'function') options.onReady(this)
                        return
                    }).catch(err => {
                        console.log('Web Bluetoooth connection error', err)
                        return err
                    })
                }
            }
        }
    }

    function onCordovaBLEConnect (result) {

        if (result.status === 'connected') {
            // console.log('onCordovaBLEConnect', result, instance.options.connectionData)
            instance.__connectedAddress = result.address
            // Disconnect if a connection to a wrong module is passively resumed
            if (result.address != instance.options.connectionData.address) {
                instance.disconnect()
            }
            // Stop auto-reconnecting
            clearInterval(instance.autoReconnectIntervalID)
            delete this.autoReconnectIntervalID;

            if (instance.isActivelyDisconnected) { // Disconnected for 10+ seconds and give up connecting
//                console.log('BluetoothDevice is actively disconnected');
                instance.disconnect()
                return;
            }

            instance.isConnected = true;
            instance.sn = BluetoothDevice.getValidSN(result.sn, result.address) // In case prototype has no SN
            instance.shortSN = BluetoothDevice.getValidShortSN(instance.sn) // Short sn is a 3-digit number for BLE pairing
            instance.deviceInfo = result
//            console.log('BluetoothDevice ' + instance.sn + ' connected');
            if (typeof options.onDeviceConnect == 'function') options.onDeviceConnect(instance)
            instance.enumerateServices()

            // Save it to the connected devices list
            instance.manager.connectedDevices[options.connectionData.address] = instance

        } else if (result.status === 'disconnected') {

//            console.log('BluetoothDevice ' + result.name + ' disconnected', result);
//            instance.isConnected = false;
            instance.onBLEDisconnect()

            // Remove it to the connected devices list
//            delete instance.manager.connectedDevices[address];

        } else {
            console.log('bluetoothle.connect.onCordovaBLEConnect', result)
        }

    }

}

// Disconnect the device actively
BluetoothDevice.prototype.disconnect = function () {

    if (!this.manager.isOn) return;

    // console.log('BluetoothDevice.disconnect');
    clearInterval(this.autoReconnectIntervalID); // Force stopping auto reconnecting
    delete this.autoReconnectIntervalID;

    var instance = this;

    // Mark active disconnection and avoid auto-reconnecting
    this.isActivelyDisconnected = true;

    if (Compatibility.supportsCordovaBluetooth()) {
        // To really disconnect a device in iOS 10, disconnect() must be called before close()
        bluetoothle.disconnect(function (result) {
            instance.onBLEDisconnect(result)
        }, Bluetooth.onError, {address: this.__connectedAddress});
        // bluetoothle.close(function (result) {
        //    instance.onBLEDisconnect(result)
        // }, Bluetooth.onError, {address: this.address});
    } else if (Compatibility.supportsWebBluetooth()) {
        if (this.__chromeNotifyCharacteristic) {
            this.__chromeNotifyCharacteristic.stopNotifications()
            this.__chromeNotifyCharacteristic.removeEventListener('characteristicvaluechanged', this.__chromeNotifyCharacteristicEventListener)
        }
        if (this.__chromeBLEServer.connected) this.__chromeBLEServer.disconnect()
    }

}

// Invoked when BLE is disconnected passively
BluetoothDevice.prototype.onBLEDisconnect = function (result) {

    var instance = this;

    console.log('BluetoothDevice.onBLEDisconnect');
    bluetoothle.close(onBLEClose, Bluetooth.onError, {address: this.options.connectionData.address});
    this.isConnected = false;

    // Remove it to the connected devices list
    delete this.manager.connectedDevices[this.options.connectionData.address];

    // Invoke callback
    if (typeof this.options.onDisconnect == 'function') this.options.onDisconnect();

    function onBLEClose (result) {
//        console.log('BluetoothDevice.disconnect.onBLEClose', result);
    }

}



// Monitor the change of a specific characteristic
// @param onData: function(Uint8Array) - Callback invoked when subscribed data received from the BLE device
BluetoothDevice.prototype.subscribe = function (onData) {

    if (!this.manager.isOn) return;

    if (Compatibility.supportsCordovaBluetooth()) {
        bluetoothle.subscribe(onBluetoothSubscription, Bluetooth.onError, {
            address: this.options.connectionData.address,
            service: Bluetooth.NOTIFY_SERVICE,
            characteristic: Bluetooth.NOTIFY_CHARACTERISTIC
        });
        function onBluetoothSubscription (result) {
            if (result.status == 'subscribedResult') {
                if (typeof onData == 'function') onData(bluetoothle.encodedStringToBytes(result.value));
            }
        }
    } else if (Compatibility.supportsWebBluetooth()) {
        // console.log('BluetoothDevice.subscribe');
        this.__chromeNotifyCharacteristicEventListener = function (event) {
            if (typeof onData == 'function') onData(new Uint8Array(event.target.value.buffer));
        }
        this.__chromeNotifyCharacteristic.addEventListener('characteristicvaluechanged', this.__chromeNotifyCharacteristicEventListener)
        this.__chromeNotifyCharacteristic.startNotifications().catch(err => { return err });
    }

}



// Instantly write a packet of data to the connected device
// Called by BluetoothDevice.prototype.downSampledWrite()
// Compatible with Cordova and Web Bluetooth
// In Chrome mode, data larger than 20 bytes will be splited into multi packets
// @param value: array of int - Complete packet data to send including the protocol header, modelNumber, port, command, and value
// @param start: int - The starting position of the packet within value. Default = 0
BluetoothDevice.prototype.write = function (value, start) {
    if (!this.manager.isOn) return
    // console.log('BluetoothDevice.prototype.write', value)
    if (isNaN(start)) start = 0
    let instance = this
    if (value.length > 20) console.log('BluetoothDevice.prototype.write', value[8], '->', start)
    if (Compatibility.supportsCordovaBluetooth()) {
        bluetoothle.writeQ(
            result => {},
            error => {
                if (value.length > 20) console.log('!', error)
            },
            {
                type: BluetoothDevice.WRITE_TYPE,
                address: this.options.connectionData.address,
                service: Bluetooth.WRITE_SERVICE,
                characteristic: Bluetooth.WRITE_CHARACTERISTIC,
                value: bluetoothle.bytesToEncodedString(value)
                // value: bluetoothle.bytesToEncodedString(value.slice(start, start + BluetoothDevice.WRITE_PACKET_SIZE))
            }
        )
        // if (start + BluetoothDevice.WRITE_PACKET_SIZE < value.length) {
        //     setTimeout(() => {this.write(value, start + BluetoothDevice.WRITE_PACKET_SIZE)}, 20)
        // }
    } else if (Compatibility.supportsWebBluetooth()) {
        if (this.__chromeWriteCharacteristic) this.__chromeWriteCharacteristic.writeValue(new Uint8Array(value.slice(start, start + BluetoothDevice.WRITE_PACKET_SIZE)))
        .then(() => {
            if (start + BluetoothDevice.WRITE_PACKET_SIZE < value.length) this.write(value, start + BluetoothDevice.WRITE_PACKET_SIZE)
        })
        .catch(Bluetooth.onError)
    }

}



// Write to the connected device with down-sampling
// @param value: array of int - Complete packet data to send including the protocol header, modelNumber, port, command, and value
// @param bufferID (int) Down-sampling buffer ID. Default = 0. For data like motor spinning commands, you must add a non-zero bufferID to avoid conflict with routine battery check command. Or there will be a chance that the motor spin command is overwritting by the battery check and the motor doesn't run in the right state.
BluetoothDevice.prototype.downSampledWrite = function (value, bufferID) {

    if (!this.manager.isOn) return;
    var instance = this;

    if (typeof bufferID == 'undefined') bufferID = 0;
    if (typeof this.buffer[bufferID] == 'undefined') this.buffer[bufferID] = {
        lastWriteTime: 0
    };
    instance.buffer[bufferID].dataToWrite = value;

    var t = new Date().getTime() - instance.buffer[bufferID].lastWriteTime;
    if (t < Bluetooth.WRITE_INTERVAL) {
        // Recent write() operation found. Down-sample.
        clearTimeout(instance.buffer[bufferID].writeTimeoutID);
        instance.buffer[bufferID].writeTimeoutID = setTimeout(doWrite, Bluetooth.WRITE_INTERVAL);
    } else {
        // No recent write() operation
//        if (data.debug != undefined) console.log('downSampledWrite (instant) ' + Uint8Array2Hex(bluetoothle.encodedStringToBytes(data.value)));
        doWrite() // Instant writing
    }

    function doWrite () {
        // if (instance.buffer[bufferID].dataToWrite[8] == TModule.COMMAND_GET_SERIAL_NUMBER) console.log('doWrite', instance.buffer[bufferID].dataToWrite)
        instance.buffer[bufferID].lastWriteTime = new Date().getTime()
        instance.write(instance.buffer[bufferID].dataToWrite)
    }

}

// Enumerate available services and characteristics and call the onReady() callback
BluetoothDevice.prototype.enumerateServices = function () {

    if (!this.manager.isOn) return;

    var instance = this;
    var services = [];
    var currentService = 0;
    console.log('BluetoothDevice.enumerateServices');
    // discover() is supported on both iOS and Android
    bluetoothle.discover(onDiscover, Bluetooth.onError, {address: this.options.connectionData.address});
    function onDiscover (result) {
        console.log('- onDiscover');
        if (typeof instance.options.onReady == 'function') instance.options.onReady(instance);
    }

//    bluetoothle.services(onBLEServicesSuccess, Bluetooth.onError, {address: this.address});

    // Serialize the calling of characteristics()
    // Only 1 concurrent calling will work
    function onBLEServicesSuccess (result) {
//        console.log('Available services', result.services);
        services = result.services;
        bluetoothle.characteristics(onBLECharacteristicsSuccess, Bluetooth.onError, {
            address: result.address,
            service: services[currentService]
        });
    }

    function onBLECharacteristicsSuccess (result) {
//        console.log('Available characteristics for ' + result.service, result.characteristics);
        currentService ++;
        if (services.length > currentService) {
            bluetoothle.characteristics(onBLECharacteristicsSuccess, Bluetooth.onError, {
                address: result.address,
                service: services[currentService]
            });
        } else {
            if (typeof instance.options.onReady == 'function') instance.options.onReady(instance);
        }
    }

}

// Encode a 3-part string serial number into a 4-byte array of numbers
// Only to fix the SN bug in firmware v3 (protocol v3)
// @param sn: string - e.g. "05-01-0001"
// return: array of int - [modelNumber, batchNumber, highSN, lowSN]
BluetoothDevice.encodeSerialNumber = function (sn, protocolVersion) {
    if (typeof sn != 'string') return
    sn = TModule.serialNumberStringToArray4(sn)
    // Formware with protocol version 2 & 3 has a bug in interperation of serial number.
    // Must encode it to walk around
    if (protocolVersion < 4) {
        let initial = (sn[0]<<24) + (sn[1]<<16)
        let correction = initial - Math.floor(initial * .0001) * 10000
        let serial = (sn[2]<<8) + sn[3]
        serial -= correction
        if (serial < 0) serial += 10000
        sn[2] = (serial>>8)
        sn[3] = serial - (sn[2]<<8)
    }
    return sn
}

// Decode the 4-byte serial number array to a 3-part string
// Only to fix the SN bug in firmware v3 (protocol v3)
// @param a: array of int - [modelNumber, batchNumber, highSN, lowSN]
// return: string - e.g. "05-01-0001"
BluetoothDevice.decodeSerialNumber = function (a, protocolVersion) {
    // Formware with protocol version 2 & 3 has a bug in interperation of serial number.
    // Must decode it to walk around
    if (protocolVersion < 4) {
        let initial = (a[0]<<24) + (a[1]<<16)
        let correction = initial - Math.floor(initial * .0001) * 10000
        let serial = (a[2]<<8) + a[3]
        serial += correction
        if (serial > 9999) serial -= 10000
        a[2] = (serial>>8)
        a[3] = serial - (a[2]<<8)
    }
    return TModule.serialNumberArray4ToString(a)
}


// Validate current SN and generate a valid one based-on the BLE address if necessary
// @param address (string) Current SN
// @param address (string) BLE address to generate SN
BluetoothDevice.getValidSN = function (sn, address) {
    if (sn) {
        return sn;
    } else {
        sn = (address.charCodeAt(address.length-1) << 8) + address.charCodeAt(address.length-1); // In case prototype has no SN
        return sn;
    }
}

// Short sn is a 4-digit number for BLE pairing
// @param sn (string)
BluetoothDevice.getValidShortSN = function (sn) {
    sn *= .0001;
    sn = (sn - Math.floor(sn)) * 10000;
    sn = sn.toFixed(0);
    while (sn.length < 4) sn = '0' + sn;
    return sn;
}
