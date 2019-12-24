/*
* Tinkamo Module Class Library
* For Hardware Module Abstract Layer
* Project Tinkamo v0.9
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-05-16 By Jam Zhang
*/

// -----------------------------------------------------------------------------
// TFunctionModule Class
// Abstract base class for all function module
// A Funtion Module has no BLE and is connected to a Core Module to work.
// A Core Module can attach up to 4 Function Modules on port 0-3.
// Multi-port is not implemented on the current hardware during 2018-2019
// This class is designed to support multi-port feature and it is not currently used.
// -----------------------------------------------------------------------------

class TFunctionModule extends EventDispatcher {

    constructor (data, options) {
        super()
        var instance = this;
        if (!data) data = {};
        if (!options) options = {};
        if (data.iconClass) this.iconClass = data.iconClass;
        if (!data.parameterRange) data.parameterRange = 10;
        if (!data.sn) data.sn = '';
        if (!data.shortSN) data.shortSN = '';
        this.data = data;
        this.options = options;

        setTimeout(function(){instance.attachToCoreModule()}, 100);
    }

    // Compatible with TModule.connectToModule
    connectToModule (manualConnection) {this.attachToCoreModule(manualConnection);}

    // Attach a function module to a core module instance and make it work
    // If the core module instance dosn't exist, created it
    // If there is no matching core module, always retry until it is found
    // @param manualConnection: boolean - Connect to any module within range if true. Connect to a specific module if data.address exists by default.
    attachToCoreModule (manualConnection) {
        console.log('attachToCoreModule', manualConnection)
        // Delete address and port restriction if specified
        if (manualConnection) {
            this.forgetConnectedModule()
        } else {
            // Retry in case the core module hasn't got the attached port info
            this.attachToCoreModuleTimeoutID = setTimeout(function(){instance.attachToCoreModule()}, TModule.RECONNECTING_INTERVAL)
        }

//        console.log('<br>attachToCoreModule ' + this.data.id + ' ' + this.data.address);
        var instance = this

        // Create a core instance
        if (!this.core) { // Reuse core if it exists
            this.core = new TCoreModule()
            this.core.addEventListener(TModule.EVENT_SET_LED_COLOR, onPowerLEDColorEvent)
            this.onPowerLEDColorEvent = onPowerLEDColorEvent
        }

        // Find the matching hardware module
        if (Compatibility.supportsCordovaBluetooth()) {

            // for cordova
            if (this.data.address) {
                clearTimeout(this.attachToCoreModuleTimeoutID)
                var corePortData = TCoreModule.findConnectablePortByModelNumber(this.data.modelNumber, {address: this.data.address})
            } else {
                // Get the port ID if the core is found via a function module model without knowing the port ID
                var corePortData = TCoreModule.findConnectablePortByModelNumber(this.data.modelNumber)
            }

            if (corePortData && corePortData.port) {
    //            console.log('attachToCoreModule found matching core', corePortData);
                clearTimeout(this.attachToCoreModuleTimeoutID)
                this.data.address = corePortData.address
                this.data.port = corePortData.port
                this.core.connectToCoreModule({
                    modelName: corePortData.modelName,
                    modelNumber: corePortData.modelNumber,
                    address: corePortData.address,
                    sn: corePortData.sn,
                    shortSN: corePortData.shortSN,
                    url: this.data.url,
                    functionModule: this
                })
                this.core.__connectPort(this, this.data.port)
            }

        } else if (Compatibility.supportsWebBluetooth() && manualConnection) {
            this.core.connectToModule(manualConnection)
            this.core.__connectPort(this, 1)
        }



        function onPowerLEDColorEvent (event) {
            instance.dispatchEvent(event)
        }

    }

    // Detach a function module from a core module instance
    detachFromCoreModule () {
        var instance = this;
        console.log('detachFromCoreModule');
        var core = this.core;
        if (core) {
            console.log('- Detaching');
            core.__disconnectPort(this, this.data.port);
//            delete this.core; // Necessary to delete core attribute once the hardware is disconnected?
//            if (this.data.address) delete this.data.address;
//            if (this.data.port) delete this.data.port;
            if (this.onPowerLEDColorEvent) {
                delete this.onPowerLEDColorEvent;
            }
        }
    }

    write (moduleID, port, command, value, bufferID, debug) {
        if (this.core) this.core.write(moduleID, port, command, value, bufferID, debug);
    }

    // Derivable callback on data communication
    onBLENotify (value) {
//        console.log('TFunctionModule.onBLENotify', value);
    }

    // Overridable callback to pass battery percentage data
    onBatteryData (percentage) {
//        console.log('TFunctionModule.onBatteryData', percentage);
    }

    // Forget connected module info and set free to connect to any module
    forgetConnectedModule () {
        console.log('forgetConnectedModule');
        delete this.data.address;
        delete this.data.port;
        delete this.manuallyDisconnected;
    }

    // Returns if the core module hardware is actively connected and the correct port is connected the function module
    isDeviceConnected () {
        return this.core && this.core.isDeviceConnected(); // && this.isFunctionModuleAttachedToCore; // (!) isFunctionModuleAttachedToCore maybe unuseful and try use core.isDeviceConnected() only
    }

    // Actively disconnecting a function module without auto re-connecting
    disconnectDevice () {
        console.log('TFunctionModule.disconnectDevice');
        this.manuallyDisconnected = true;
        clearTimeout(this.attachToCoreModuleTimeoutID);
//        if (this.core) {
//            clearInterval(this.core.connectToModuleIntervalID);
//            clearTimeout(this.core.connectToCoreModuleIntervalID);
//        }
        this.detachFromCoreModule();
//        if (this.data.address) delete this.data.address;
//        if (this.data.port) delete this.data.port;
    }

    // Disconnect the device and remove it from TModule.instances
    removeDevice () {
        if (this.core) this.core.removeDevice()
    }

    // Rerivable public callback to handle re-connecting behaviors
    onDeviceConnect () {
        console.log('functionModule.onDeviceConnect');
        var instance = this;
        delete this.manuallyDisconnected;
        clearTimeout(this.attachToCoreModuleTimeoutID);
//        TModule.addToModuleByModelNumber(this);
        if (this.core) {
            this.data.address = this.core.data.address;
            this.data.sn = this.core.data.sn;
            this.data.shortSN = this.core.data.shortSN;
            console.log('TFunctionModule.onDeviceConnect', this.core.data.modelName);
        }
        // Forward core module's power LED events to the function module
        // Broadcast event
        this.requestInitialInputValue();
        this.dispatchEvent({type: TModule.EVENT_CONNECT})
    }

    onDeviceDisconnect () {
        console.log('TFunctionModule.onDeviceDisconnect ' + this.manuallyDisconnected);
        if (this.manuallyDisconnected) {
            clearTimeout(this.attachToCoreModuleTimeoutID);
            if (this.core) {
                clearInterval(this.core.connectToModuleIntervalID);
                clearTimeout(this.core.connectToCoreModuleIntervalID);
            }
        } else {
            if (this.options.forgetConnectedModule) this.forgetConnectedModule();
            this.attachToCoreModule();
        }
//        delete this.core;
        // Broadcast event
        this.dispatchEvent({type: TModule.EVENT_DISCONNECT})
    }

    // Get the model number in serial number
    getSNModelNumber () {
        return TModule.MODULE_NUMBER_CORE;
    }

    requestInitialInputValue () {
        if (this.core) this.core.write(this.data.moduleNumber, this.data.port, TModule.COMMAND_READ_INPUT);
    }

    requestBatteryStatus () {
        if (this.core) this.core.requestBatteryStatus();
    }

    getBatteryPercentage () {
        return this.core.getBatteryPercentage();
    }

    getSerialNumber () {
        return this.core.getSerialNumber();
    }

    setSerialNumber (sn) {
        return this.core.setSerialNumber(sn);
    }

    resetSerialNumber () {
        return this.core.resetSerialNumber();
    }

    setPowerLEDColor (color) {
        if (this.core) this.core.setPowerLEDColor(color);
    }

    blinkPowerLED () {
        if (this.core) this.core.blinkPowerLED(this);
    }

    reassignLEDColors () {
        if (this.core) this.core.reassignLEDColors();
    }

}
