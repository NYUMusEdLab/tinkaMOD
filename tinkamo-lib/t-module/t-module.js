/*
* Tinkamo Module Class Library
* For Hardware Module Abstract Layer
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-12-22 By Jam Zhang
*/

// jshint esversion: 8

// -----------------------------------------------------------------------------
// TModule Class
// Abstract base class for all BLE hardware module
// -----------------------------------------------------------------------------

// Developer's note
// data.connectionData vs connectedDevice
// - data.connectionData: object - It contains the essential data to establish BLE connection, e.g. BLE address. It will be saved with the project and used to restore connection when the project is re-opened.
// - connectedDevice: BluetoothDevice - Currently connected BluetoothDevice instance. Will be forgot (deleted) when the module is manually disconnected by long-pressing the Disconnect button or, in Chrome browser, detaching the function module. Temporary passive disconnection, e.g. power-off, will not delete this attribute and allow auto-reconnection.

class TModule extends EventDispatcher {

    // @param data
    // - url: string 'mb-c2-0012/4' means a function module on port 4 of core module sn 0012
    // - modelName: string 'c2' means a Core Module
    // - id: number 27 means a Color & Lightness Sensor
    // - connectionData: object - Contains data to establish / restore BLE connection
    // @param options
    // - onDeviceConnect: function() Callback invoked when the module is connected via BLE
    // - forgetConnectedModule: Boolean If true, the module will not remember the address of a connected hardware when it is powered off. So it will connect to any matching hardware discovered. Used in the Factory Test App.
    constructor (data, options) {

        super()
        window.TMODULE = this
        var instance = this
        this.instanceID = TModule.instances.length
        TModule.instances.push(this)
        this.batteryPercentage = 0
        this.writeVerificationIntervalID = []

        if (data.parameterRange) data.parameterRange = 10;
        if (data.sn == undefined) data.sn = '';
        if (data.shortSN == undefined) data.shortSN = '';
        data.uniqueID = new Date().getTime() + Math.floor(Math.random() * 4294967296) // Unique ID of the module instance. Never used
        this.data = data

        if (!options) options = {};
        if (isNaN(options.retry)) options.retry = -1;
        if (typeof options.onConnect == 'function') this.onDeviceConnect = options.onConnect;
        if (typeof options.onDeviceConnect == 'function') this.__onDeviceConnect = options.onDeviceConnect;
        this.options = options;

        // Attemp to connect via BLE if it is not a core module
        // if (!this.isCore() && this.data && this.data.connectionData && this.data.connectionData.address) {
            setTimeout(function(){
                instance.connectToModule()
            }, 100)
        // }

    }



    // Connection ----------------

    // Forget connected module info and set free to connect to any module
    forgetConnectedModule () {
        console.log('forgetConnectedModule')
        delete this.manuallyDisconnected
        delete this.data.address
        delete this.data.connectionData
        delete this.data.protocolVersion
        this.data.originalSN = ''
        this.data.shortSN = ''
        this.data.sn = ''
    }

    // Returns if the hardware device is actively connected and working
    isDeviceConnected () {
        return Bluetooth.instance && Bluetooth.instance.isOn && this.connectedDevice && this.connectedDevice.isConnected
    }

    // Return the possible model numbers for the module
    get possibleModelNumbers () {
        if (this.data.modelNumberGroup) return this.data.modelNumberGroup
        return [this.data.modelNumber]
    }

    matchesPossibleModelNumbers (modelNumber) {
        for (let m of this.possibleModelNumbers) {
            if (m == modelNumber) return true
        }
        return false
    }

    // Connect to BLE device using constructor's data parameter with auto-retries
    // @param manualConnection: boolean
    // Cordova: Connect to any module detected if true. Connect to a specific module if data.address exists by default.
    // Chrome: Show Chrome BLE popup dialog
    async connectToModule (manualConnection) {

        // Allow resuming of connection
        delete this.manuallyDisconnected

        // Delete address and port restriction if specified
        if (manualConnection) {
            this.forgetConnectedModule();
        }

        // console.log('connectToModule', this.data);
        var ble = Bluetooth.instance;
        if (!ble) return false
        var instance = this
        var retriesLeft = this.options.retry;
        var data = this.data;

        if (manualConnection) {
            // console.log('manualConnection');
            // Allow popup dialog for only once in manual mode
            ble.requestDevice(this.possibleModelNumbers)
            .then(result => {
                // console.log('then', result);
                if (result && result.address) { // Cordova mode
                    this.data.connectionData = {address: result.address}
                } else { // Chrome web mode
                    this.data.connectionData = {device: result}
                }
                // Then auto connect
                autoConnectAvailableModule()
            })
            .catch(error => {
                console.log('catch', error);
            })
        } else if (this.data.connectionData) {
            // console.log('autoConnection with data');
            // Auto reconnect if previously connected to a module.
            autoConnectAvailableModule()
        } else if (window.Pandora && Pandora.preferences && !Pandora.preferences.alwaysConnectWithSN) {
            // Delayed connecting to all available modules of the same type if no specific BLE address is given
            // console.log('autoConnection with modelNumber (delayed)');
            setTimeout(function(){
                autoConnectAvailableModule()
            }, TModule.RECONNECTING_INTERVAL)
        }

        // Repeatedly call doConnectAvailableModule() to connect
        function autoConnectAvailableModule () {
            clearInterval(instance.connectToModuleIntervalID);
            if (instance.options.retry != 0) {
                instance.connectToModuleIntervalID = setInterval(doConnectAvailableModule, TModule.RECONNECTING_INTERVAL)
            }
        }

        // Connect to any matching hardware module available
        function doConnectAvailableModule (manualConnection) {

            // Schedule next retry if available
            if (retriesLeft > 0) retriesLeft --;
            if (retriesLeft == 0) { // Always retry if negative
                clearInterval(instance.connectToModuleIntervalID);
            }

            // To-do: Shall tell if the device with the address is connected to the right model of function module first.
            if (instance.data.connectionData) {
                // Try to reconnect if data.connectionData is available
                let matchingDevice = ble.findDevice({
                    modelNumber: instance.data.modelNumber,
                    address: instance.data.connectionData.address,
                }, {
                    manualConnection: manualConnection // Ignore BLE RSSI range limitation if true
                })
                if (matchingDevice || !Compatibility.supportsCordovaBluetooth()) {
                    // console.log('- doConnectAvailableModule ', instance.data.connectionData);
                    doConnectModule()
                }
            } else {
                // Find any available hardware matching the model number
                if (ble.getConnectableModules({possibleModelNumbers: instance.possibleModelNumbers}) > 0) {
                    instance.data.connectionData = ble.findDevice({
                        possibleModelNumbers: instance.possibleModelNumbers, // Find by model number
                    }, {
                        manualConnection: manualConnection // Ignore BLE RSSI range limitation if true
                    })
                }
            }

        }

        // Connect to the hardware module with this.data.connectionData
        // Will be called repeatedly until the module is connected
        // Compatible with Cordova and Web Bluetooth
        function doConnectModule () {
            // Schedule next retry if available
            if (retriesLeft > 0) retriesLeft --;
            if (retriesLeft == 0) { // Always retry if negative
                clearInterval(instance.connectToModuleIntervalID);
            }

            // console.log('- doConnectModule', instance.data.connectionData);
            // Connect to the BLE device if address obtained
            if (instance.data && instance.data.connectionData) {
                let options = {
                    connectionData: instance.data.connectionData,
                    onDeviceConnect: function (device) { // When BLE connection is made
                        // console.log('onDeviceConnect', device)
                        clearInterval(instance.connectToModuleIntervalID)
                    },
                    onReady: (device) => {
                        // console.log("onReady", device)
                        instance.onDeviceReady(device)
                    },
                    onDisconnect: function () {
                        // console.log('onDisconnect')
                        instance.__onDeviceDisconnect(instance.connectedDevice)
                        delete instance.connectedDevice
                    },
                    onActivelyDisconnect: function () {
                        // console.log('onActivelyDisconnect')
                        instance.onActivelyDisconnect(instance.connectedDevice)
                        delete instance.connectedDevice
                    }
                }
                if (instance.connectedDevice) {
                    console.log('reconnect');
                    instance.connectedDevice.connect(options)
                } else {
                    instance.connectedDevice = new BluetoothDevice(options)
                }
            }

        }

    }

    // Disconnect from the BLE hardware device with or without auto-reconnecting
    // @param manuallyDisconnect: boolean - Forget the connected device and never auto-reconnect if true. Default = true.
    disconnectDevice (manuallyDisconnect) {

        if (manuallyDisconnect == undefined) manuallyDisconnect = true
        if (manuallyDisconnect) {
            console.log('disconnectDevice - Never auto connect')
            this.manuallyDisconnected = true
        } else {
            console.log('disconnectDevice - Auto connect in Cordova')
            // delete this.connectionData
            // delete this.data.connectionData
        }
        clearInterval(this.connectToModuleIntervalID)
        if (!this.isDeviceConnected()) return
        var instance = this

        this.subscribeForBatteryStatus(false); // Stop requesting power status update

        // Delay disconnecting
        if (!this.disconnectTimeoutID && this.connectedDevice) {
            this.disconnectTimeoutID = setTimeout(function () {
                if (instance.connectedDevice) {
                    instance.connectedDevice.disconnect()
                    delete instance.connectedDevice
                    delete instance.disconnectTimeoutID
                }
            }, 500) // Wait for beforeDisconnectingDevice() to finish
        }
    }

    // Disconnect the device and remove it from TModule.instances
    removeDevice () {
        delete TModule.instances[this.instanceID]
        this.disconnectDevice()
    }

    // Disconnect all devices
    static disconnectAllDevices () {
        for (let m of TModule.instances) {
            if (m && m.disconnectDevice) m.disconnectDevice()
        }
    }

    onDeviceReady (device) { // When module is connected and all services and characteristics are enumerated
        // this.connectedDevice = device;
        console.log('%cTModule.onDeviceReady()', 'color: red');
        if (device.options.connectionData) this.data.connectionData = device.options.connectionData;
        if (device.protocolVersion) this.data.protocolVersion = device.protocolVersion;
        setTimeout(() =>{this.getSerialNumber();}, 100);
        // setTimeout(() =>{this.getSerialNumber();}, 1000);
        this.data.sn = ''
        this.__onDeviceConnect(device);
    }

    // Overridable private callback invoked when hardware device is connected
    __onDeviceConnect (device) {
        // console.log('TModule.__onDeviceConnect manuallyDisconnected=' + this.manuallyDisconnected)
        if (this.manuallyDisconnected && !this.isCore()) {
            this.disconnectDevice()
            return
        }

        var instance = this
        this.data.connectionData = device.options.connectionData

        // Subscribe to all data from module -> app
        this.subscribe (value => {
            if (value) this.onBLENotify(value)
        })
        this.subscribeForBatteryStatus(true)
        this.requestDefaultInputValue()
        this.requestProtocolVersion()

        // Broadcast event
        this.dispatchEvent({type: TModule.EVENT_CONNECT})
        // console.log('TModule.__onDeviceConnect end')

    }

    requestDefaultInputValue () {
        this.write(this.data.modelNumber, 1, TModule.COMMAND_READ_INPUT) // Request default input value if it is a function module
    }

    requestProtocolVersion () {
        this.write(this.data.modelNumber, 0, TModule.COMMAND_PROTOCOL_VERSION) // Request the protocol version
        this.__requestProtocolVersionTimeoutID = setTimeout(() => {this.requestProtocolVersion()}, 500)
    }

    // Overridable private callback invoked when hardware device is disconnected
    __onDeviceDisconnect(device) {
        // console.log('TModule.__onDeviceDisconnect', this.data.connectionData, this.options.forgetConnectedModule)
        this.data.originalSN = ''
        this.data.shortSN = ''
        this.data.sn = ''
        this.setPowerLEDColor(0); // Reset hardware LED color to off
        if (this.options.forgetConnectedModule) this.forgetConnectedModule()
        // console.log(this.data.connectionData, this.manuallyDisconnected, this.isCore())
        // if (!this.manuallyDisconnected && !(this.isCore() && Compatibility.supportsCordovaBluetooth())) this.connectToModule() // Don't auto reconnect a Core Module in Cordova mode
        if (!this.manuallyDisconnected) this.connectToModule() // Don't auto reconnect a Core Module in Cordova mode
        this.dispatchEvent({type: TModule.EVENT_DISCONNECT}) // Broadcast event
    }

    // Overridable callback invoked when the hard request to unpair and stop auto-reconnecting
    // In case the hardware device is connected to a wrong iPad so you want to reclaim the connectivity
    onActivelyDisconnect (device) {
    }

    isCore () {
        return this.__isCoreModule
    }



    // Communication ----------------

    // App authenticates module
    // Authenticate using AES ECB encryption to ban unauthorized hardware
    authenticateModule () {
        if (!window.bluetoothle || !window.bluetoothle.encrypt) return;
        this.__plainTextByApp = [];
        while (this.__plainTextByApp.length < 16) {
            this.__plainTextByApp.push(Math.round(33 + Math.random() * (126-33)));
        }
//        window.TEST_PLAIN_TEXT = '0123456789ABCDEF';
//        this.__plainTextByApp = string2Uint8Array(TEST_PLAIN_TEXT);
        console.log('Plain text by app: ' + array2String(this.__plainTextByApp) + ' -> Module');
        this.write(0, 0, TModule.COMMAND_APP_AUTHENTICATE_MODULE, Array.from(this.__plainTextByApp));

    }

    // JS version of Authenticate
    // For debug only. Deprecated
    static authenticateJS (text) {
        // An example 128-bit key
        var key = [0x36, 0x39, 0x30, 0x42, 0x31, 0x41, 0x32, 0x44, 0x34, 0x43, 0x35, 0x45, 0x37, 0x33, 0x38, 0x46];

        // Convert text to bytes
        if (!text) text = '0123456789ABCDEF';
        if (typeof text == 'string') { // Convert String to Uint8Array
            text = aesjs.utils.utf8.toBytes(text);
        } else if (text.push) { // Convert Array to Uint8Array
            console.log('Convert Array to Uint8Array', text);
            text = new Uint8Array(text);
        }

        var aesEcb = new aesjs.ModeOfOperation.ecb(key);
        var encryptedBytes = aesEcb.encrypt(text);

        // To print or store the binary data, you may convert it to hex
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
//        console.log(encryptedHex);
        // "a7d93b35368519fac347498dec18b458"

        // When ready to decrypt the hex string, convert it back to bytes
        var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);

        // Since electronic codebook does not store state, we can
        // reuse the same instance.
        //var aesEcb = new aesjs.ModeOfOperation.ecb(key);
        var decryptedBytes = aesEcb.decrypt(encryptedBytes);

        // Convert our bytes back into text
        return encryptedBytes; //aesjs.utils.utf8.fromBytes(decryptedBytes);
//        console.log('authenticateJS software decrypted:', decryptedText);
        // "TextMustBe16Byte"
    }

    // Get the model number in serial number
    // Function modules don't have SN. Instead, the model number will be 0x00 of the Core Module.
    getSNModelNumber () {
        return this.__isCoreModule ? TModule.MODULE_NUMBER_CORE: this.data.modelNumber;
    }

    // Get the unique serial number of the module
    getSerialNumber () {
        if (this.isDeviceConnected()) {
            this.write(0, 0, TModule.COMMAND_GET_SERIAL_NUMBER);
        }
    }

    // Set serial number and write it into the flash memory of the module
    // @param sn: string - Serial number formatted as '05-01-0315'
    setSerialNumber (sn) {
        console.log('setSerialNumber', sn, BluetoothDevice.encodeSerialNumber(sn, this.data.protocolVersion))
        if (this.isDeviceConnected() && sn) {
            this.write(0, 0, TModule.COMMAND_SET_SERIAL_NUMBER, BluetoothDevice.encodeSerialNumber(sn, this.data.protocolVersion), -1, true)
        }
    }

    // Reset the serial number to 00-00-0000 to enable automatical increamental writing
    resetSerialNumber () {
        if (this.isDeviceConnected()) {
            this.write(0, 0, TModule.COMMAND_SET_SERIAL_NUMBER, [0,0,0,0]);
        }
    }

    // Convert a serial number string into an array of 3 elements
    // @param sn (string) E.g. "05-01-0025"
    // return (array) E.g. [5,1,25]
    static serialNumberStringToArray3 (sn) {
        if (typeof sn != 'string') return;
        var s = sn.split('-');
        if (s.length != 3) return;
        var modelNumber = Number(s[0]);
        if (isNaN(modelNumber)) return;
        var batchNumber = Number(s[1]);
        if (isNaN(batchNumber)) return;
        var serialNumber = Number(s[2]);
        if (isNaN(serialNumber)) return;
        return [modelNumber, batchNumber, serialNumber];
    }

    // Convert a serial number string into an array of 4 elements
    // @param sn (string) E.g. "05-01-0025"
    // return (array) E.g. [5,1,0,25]
    static serialNumberStringToArray4 (sn) {
        if (typeof sn != 'string') return;
        var s = sn.split('-');
        if (s.length != 3) return;
        var modelNumber = Number(s[0]);
        if (isNaN(modelNumber)) return;
        var batchNumber = Number(s[1]);
        if (isNaN(batchNumber)) return;
        var serialNumber = Number(s[2]);
        if (isNaN(serialNumber)) return;
        var SNHi = serialNumber >> 8; // Higher byte of SN
        var SNLo = serialNumber - (SNHi << 8); // Lower byte of SN
        return [modelNumber, batchNumber, SNHi, SNLo];
    }

    // Convert a serial number array of 3 elements into a string
    // @param sn (array) E.g. [5,1,256]
    // return (string) E.g. "05-01-0256"
    static serialNumberArray3ToString (sn) {
        if (typeof sn == 'object' && sn.length && sn.length == 3) {
            return GenericLib.toFixedInt(sn[0],2) + '-' + GenericLib.toFixedInt(sn[1],2) + '-' + GenericLib.toFixedInt(sn[2], 4);
        } else {
            return '';
        }
    }

    // Convert a serial number array of 4 elements into a string
    // @param sn (array) E.g. [5,1,1,0]
    // return (string) E.g. "05-01-0256"
    static serialNumberArray4ToString (sn) {
        if (typeof sn == 'object' && sn.length && sn.length == 4) {
            return GenericLib.toFixedInt(sn[0],2,16) + '-' + GenericLib.toFixedInt(sn[1],2) + '-' + GenericLib.toFixedInt((sn[2]<<8) + sn[3], 4);
        } else {
            return '';
        }
    }

    // Convert a long serial number string into a short version
    // @param sn (string) E.g. "05-01-1725"
    // return (string) E.g. "725"
    static serialNumberStringToShort (sn) {
        if (typeof sn == 'string' && sn.length >= 4) {
            return sn.substr(sn.length - 4);
        } else {
            return '';
        }
    }

    // Request for periodical power status update
    // @param subscribe (boolean) If to subscribe or to unsubscribe
    subscribeForBatteryStatus (subscribe) {
//        console.log('subscribeForBatteryStatus');
        var instance = this;
        if (subscribe) {
            if (!this.subscribeForBatteryStatusIntervalID) {
                this.requestBatteryStatus(); // Call for once immediately
                this.subscribeForBatteryStatusIntervalID = setInterval (function(){instance.requestBatteryStatus()}, TModule.BATTERY_CHECKING_INTERVAL);
            }
        } else if (this.subscribeForBatteryStatusIntervalID) {
            clearInterval(this.subscribeForBatteryStatusIntervalID);
            delete this.subscribeForBatteryStatusIntervalID;
        }
    }

    requestBatteryStatus () {
        if (this.isDeviceConnected()) {
            this.write(0, 0, TModule.COMMAND_POWER_STATUS);
        }
    }

    getBatteryPercentage () {
        return this.batteryPercentage;
    }

    // Monitor the change of all ports from the BLE subscription result
    // v: typedarray
    onBLENotify (v) {
        let instance = this
        let modelNumber = v[6]
        let port = v[7]
        let command = v[8]

        // console.log('onBLENotify modelNumber', modelNumber)
        // console.log('onBLENotify ', v,  Uint8Array2Hex(v))

        // Second packet of data from hardware module
        // BLE protocol can only sned 20 bytes in each packet
        // Larger data must be sent in 2 continious packets
        if (v.length < 9) {
            switch (this.__previousCommand) {

                // The module actively authenticate the app
                case TModule.COMMAND_MODULE_AUTHENTICATE_APP:
                    this.__plainTextByModule.set(v ,11);
                    console.log('Plain text by module', Uint8Array2Hex(this.__plainTextByModule));
                    bluetoothle.encrypt(onEncryptAndSendToModule, function(){}, {content: Array.from(this.__plainTextByModule)});
                    console.log('Cypher by JS:', Uint8Array2Hex(TModule.authenticateJS(this.__plainTextByModule)));
                    break;

                // The app actively authenticate the module
                case TModule.COMMAND_APP_AUTHENTICATE_MODULE:
                    this.__cypherByModule.set(v ,11);
                    bluetoothle.encrypt(onEncryptAndCompareModuleCypher, function(){}, {content: Array.from(this.__plainTextByApp)});
                    break;

            }
            return;
        }

        // Verify the write commands
        // Stop rewriting after receiving the notification with the identical commmand ID
        if (typeof this.writeVerificationIntervalID[command] == 'number') {
            console.log('TModule.write() - verified', command, v[9]);
            clearInterval(this.writeVerificationIntervalID[command])
            delete this.writeVerificationIntervalID[command]
        }

        switch (command) {

            case TModule.COMMAND_READ_INPUT:
                // Stop rewriting after Motor / Servo receiving the notification with the identical commmand ID
                // if ((this.data.modelNumber == TModule.MODULE_NUMBER_MOTOR || this.data.modelNumber == TModule.MODULE_NUMBER_SERVO) && this.writeVerificationIntervalID[command]) {
                break;

            case TModule.COMMAND_POWER_STATUS:
                if (port == 0) {
                    this.batteryPercentage = v[9]; // 0xFF = Charging, otherwise = battery percentage
                    this.onBatteryData(this.batteryPercentage);
                }
                break;

            // The module actively authenticate the app
            case TModule.COMMAND_MODULE_AUTHENTICATE_APP:
                this.__previousCommand = TModule.COMMAND_MODULE_AUTHENTICATE_APP;
                this.__plainTextByModule = new Uint8Array(16);
                this.__plainTextByModule.set(v.subarray(9)); // Fill in the 11 bytes received in packet #1
                console.log('Plain text by module -> app (complete command): ' + Uint8Array2Hex(v));
                break;

            // The app actively authenticate the module
            case TModule.COMMAND_APP_AUTHENTICATE_MODULE:
                this.__previousCommand = TModule.COMMAND_APP_AUTHENTICATE_MODULE;
                this.__cypherByModule = new Uint8Array(16);
                this.__cypherByModule.set(v.subarray(9));
                console.log('Cypher by module -> app (complete command): ' + Uint8Array2Hex(v));
                break;

            // Protocol version
            case TModule.COMMAND_PROTOCOL_VERSION:
                console.log('Protocol version', v[9])
                clearTimeout(this.__requestProtocolVersionTimeoutID)
                this.data.protocolVersion = v[9]
                this.__connectedModelNumber = modelNumber
                if (this.data.modelNumber != this.__connectedModelNumber) {
                    console.log('Model numbers mismatch. Disconnecting...')
                    this.disconnectDevice()
                }
                break

            // The module returns the serial number
            case TModule.COMMAND_GET_SERIAL_NUMBER:
                var a = v.subarray(9);
                // Decode the dec SN into hex
                this.data.sn = BluetoothDevice.decodeSerialNumber(a, this.data.protocolVersion)
                this.data.shortSN = this.data.sn.split('-')[2]
                this.data.originalSN = a
                if (this.data.shortSN && this.data.shortSN.length && this.data.shortSN.length > 3) {
                    this.data.shortSN = this.data.shortSN.substr(this.data.shortSN.length - 4);
                }
                // console.log('COMMAND_GET_SERIAL_NUMBER\nFull SN', this.data.sn, '\nShort SN', this.data.shortSN, '\noriginal data', a)
                break;

        }

        // Module authenticates app
        // Callback when app has encrypted the plain text from the module and send the cypher to the module to validate
        function onEncryptAndSendToModule (result) {
            var cypher = result.result.slice(0, 16);
            console.log('Cypher by plugin: "' + Uint8Array2Hex(result.result.slice(0, 16)) + '" -> Module');
            instance.write(0, 0, TModule.COMMAND_MODULE_AUTHENTICATE_APP, Array.from(cypher));
            setTimeout(onModuleAuthenticateApp, 500); // Init module and authentic it after a delay
            return cypher;
        }

        // Callback when module -> app the encrypted cypher to validate
        function onEncryptAndCompareModuleCypher (result) {
            var cypherApp = result.result.slice(0, 16);
            console.log('Plain text by app: ' + array2String(instance.__plainTextByApp) + ' -> Module'
                + '\n<br>Cypher by module: ' + Uint8Array2Hex(instance.__cypherByModule)
                + '\n<br>Cypher by app: ' + Uint8Array2Hex(cypherApp)
                + '\n<br>Authenticated: ' + isArraysIdentical(instance.__cypherByModule, cypherApp)
            );
            // Should disconnect the module if failed to authenticate
            return result.result == instance.__cypherByModule;
        }

        function onModuleAuthenticateApp () {
            instance.authenticateModule();
            instance.onAuthenticate();
        }

    }

    // Overridable callback when the app is authenticated by the module
    onAuthenticate () {}

    // Set the color of the power LED
    // @param color (int) Hardware module color number [0, 7]
    setPowerLEDColor (color) {
        if (isNaN(color)) return;
        if (this.isDeviceConnected()) {
            // console.error('TModule.setPowerLEDColor', color);
            this.write(0, 0, TModule.COMMAND_SET_LED_COLOR, [color]);
        }
        // Dispatch event for TUI to sync up
        this.dispatchEvent({
            type: TModule.EVENT_SET_LED_COLOR,
            value: color
        });
    }



    // Bluetooth IO ----------------

    // Write a command to a function module through a core module, down-sampled and auto-retried
    // @param modelNumber (int) Numeric ID of the module, e.g. MODULE_CORE=0, MODULE_JOYSTICK=4
    // @param port (int) Port ID of the function module being communicated
    // @param command (int) Command complied to the BLE protocol
    // @param value (array/typedArray) Optional data body defined by the command in the protocol
    // @param verify: boolean - Verify if the write() gets a notification with the same commandID that confirms the receiving of the write(). Will rewrite periodically if not verified. Default = false.
    // @param debug (boolean) console.log extra debug info if ture. Default = false
    write (modelNumber, port, command, value, verify, debug) {
        if (!this.connectedDevice) return
        let instance = this
        if (value == undefined) {
            value = []
        } else if (value.constructor === Uint8Array) {
            value = Array.from(value)
        } else if (typeof value == 'number') {
            value = [value]
        } else if (typeof value == 'string') {
            // Convert string to array
            var a = []
            for (var n in value) a.push(value.charCodeAt(n))
            value = a
            console.log('write string->array', value)
        }
        if (isNaN(this.data.protocolVersion)) this.data.protocolVersion = 2
        // Tinkamo BLE protocol
        let bytes = [0x5A, 0xAB, value.length + 7, 0, 0, this.data.protocolVersion, modelNumber, port, command].concat(value)

        doWrite()
        // Each command has its own rewriting with interval to avoid conflict
        if (verify) {
            // console.log('TModule.write() - verifying');
            clearInterval(this.writeVerificationIntervalID[command])
            this.writeVerificationIntervalID[command] = setInterval(doWrite, Bluetooth.WRITE_INTERVAL)
        }

        function doWrite () {
            if (verify && debug) console.log('-', command, value);
            if (instance.connectedDevice) instance.connectedDevice.downSampledWrite(bytes, {
                bufferID: command,
                singlePacket: instance.data.protocolVersion >= 4 // V4 modules uses the ChipMunk chip which supports extra-long packet so we don't need to split it
            })
        }
        // if (debug) {console.log('TModule.write ', dataToWrite)}

    }

    // Subscribe to the BLE notification
    // callback: function
    subscribe (callback) {
        // console.log('TModule.subscribe()', this.connectedDevice);
        this.connectedDevice.subscribe(callback)
    }

    // Overridable callback to pass battery percentage data
    onBatteryData (percentage) {}

    static startScanning () {
        TModule.isScanningForLiveModules = true;
        Bluetooth.instance.startScanning({
            filterServices: Bluetooth.SERVICE_FILTER,
            rssiRange: Bluetooth.RSSI_RANGE,
            alwaysOn: true
        });
    }

}

// add constants, static attributes and static methods to TModule class
$.extend(TModule, {

    instances: [], // Static array of TModule instances

    // Find an existing or connected module with the criteria to reuse
    // @param data (object)
    // - data.modelName / data.modelNumber (string) Model string to look for, r.g. 'i1' == TFunctionModuleButton

    // Events
    EVENT_CONNECT: 'TModuleEventConnect',
    EVENT_DISCONNECT: 'TModuleEventDisconnect',
    EVENT_SET_LED_COLOR: 'TModuleEventSetLEDColor',

    // BLE Channels
    NOTIFY_SERVICE: 'FFFA',
    NOTIFY_CHARACTERISTIC: 'FFFB',
    WRITE_SERVICE: 'FFFA',
    WRITE_CHARACTERISTIC: 'FFFC',

    // Brain
    MODULE_NUMBER_BRAIN: 254,

    // Core
    MODULE_NUMBER_CORE: 0,

    // Function Controllers
    MODULE_NUMBER_BUTTON: 1,
    MODULE_NUMBER_KNOB: 2,
    MODULE_NUMBER_SLIDER: 3,
    MODULE_NUMBER_JOYSTICK: 4,

    // Motion
    MODULE_NUMBER_MOTOR: 5,
    MODULE_NUMBER_SERVO: 6,
    MODULE_NUMBER_MOTOR_DRIVER: 7,

    // Function Look
    MODULE_NUMBER_RGB_LED: 10,
    MODULE_NUMBER_LED_MATRIX: 11,
    MODULE_NUMBER_LED_STRIPE: 13,

    // Function Sensors
    MODULE_NUMBER_PATH_FINDER: 22,
    MODULE_NUMBER_LASER_DISTANCE: 23,
    MODULE_NUMBER_SOUND: 24,
    MODULE_NUMBER_ATMOSPHERE: 25,
    MODULE_NUMBER_SOIL_HUMIDITY: 26,
    MODULE_NUMBER_COLOR_LIGHTNESS: 27,
    MODULE_NUMBER_COLOR_LIGHTNESS_2019: 28, // With improved LED consistency

    // Standalone Modules (Deprecated)
    MODULE_NUMBER_STANDALONE_ULTRASONIC: 9,
    MODULE_NUMBER_STANDALONE_IRDISTANCE: 8,
    MODULE_NUMBER_STANDALONE_COLOR: 12,
    MODULE_NUMBER_STANDALONE_JOYSTICK: 14,
    MODULE_NUMBER_STANDALONE_GPIO: 15,

    // Command ID used in V2 Bluetooth data protocol
    COMMAND_PROTOCOL_VERSION: 0xFF,
    COMMAND_MODULE_AUTHENTICATE_APP: 0xA0, // The module actively authenticate the app
    COMMAND_APP_AUTHENTICATE_MODULE: 0xA1, // The app actively authenticate the module
    COMMAND_GET_SERIAL_NUMBER: 0xA2, // Get the unique serial number of the module
    COMMAND_SET_SERIAL_NUMBER: 0xA3, // Write a serial number to the flash memory of the module
    COMMAND_POWER_STATUS: 0xFE,
    COMMAND_SET_LED_COLOR: 0xFD,
    COMMAND_READ_INPUT: 0x00,

    // BLE Buffer IDs
    CONTROL_BUFFER_ID: 100,
    SYSTEM_BUFFER_ID: 0,
    GPIO_MONITORING_INTERVAL: 50, // Interval in ms between continuous reading of GPIO ports

    // Events
    EVENT_CONNECT_DEVICE: 'connectDevice',
    EVENT_DISCONNECT_DEVICE: 'disconnectDevice',

    // Snap module to grids
    GRID_SIZE: 20,
    SNAPPING_TWEENING_DURATION: .25,

    // Possible LED Colors
    LED_COLOR: [
        6, // Sky
        2, // Green
        3,  // Yellow
        4, // Blue
        5,  // Violet
        1 // Red
    ],

    // LED Colors in web color model
    LED_WEB_COLOR: [
        '#0ff', // Sky
        '#0f0', // Green
        '#ff0',  // Yellow
        '#00f', // Blue
        '#f0f',  // Violet
        '#f00' // Red
    ],

    LED_BLINKING_INTERVAL: 200,

    BATTERY_CHECKING_INTERVAL: 2000,
    RECONNECTING_INTERVAL: 500, // Re-connecting after be disconnected passively
    MODULE_MATCHING_RANGE: 100, // When dragging a module towards another
    WATCH_BUBBLE_UPDATE_INTERVAL: 50 // Interval between 2 updates of watch bubble to save CPU
});

function array2String (arr) {
    var s = '';
    for (var n in arr) {
        s += String.fromCharCode(arr[n]);
    }
    return s;
}

function Uint8Array2Hex (arr) {
    var s = '';
    for (var n in arr) {
        var str = arr[n].toString(16);
        if (str.length < 2) str = '0' + str;
        s += str;
    }
    return s;
}

function string2Uint8Array (str) {
    var a = new Uint8Array(str.length);
    for (var n in str) a[n] = str.charCodeAt(n);
    return a;
}

function isArraysIdentical (arr1, arr2) {
    if (arr1.length != arr2.length) return false;
    for (var n in arr1) if (arr1[n] != arr2[n]) return false;
    return true;
}
