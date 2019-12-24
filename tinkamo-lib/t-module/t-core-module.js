/*
* Tinkamo Module Class Library
* For Hardware Module Abstract Layer
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2019 Tinkamo
* Rev 2019-09-03 By Jam Zhang
*/

// -----------------------------------------------------------------------------
// TCoreModule Class
// Abstract class for Core module
// -----------------------------------------------------------------------------

class TCoreModule extends TModule {

    // Only create instance of TCoreModule within TFunctionModule
    // Do not create TCoreModule alone
    constructor (data, options) {

        if (typeof data != 'object') data = {};
        data.modelNumber = TModule.MODULE_NUMBER_CORE;
        data.modelName = 'c2';
        super(data, options);
        this.__isCoreModule = true;
        TCoreModule.instances.push(this);
        window.CORE = this;
//        console.log('TCoreModule', data);

        var instance = this;
//        this.data = data; // Base class TModule has done it
        // if (this.url) this.url = this.url.split('/')[0]; // Remove port ID from the core URL
        this.connectedFunctionModuleInstances = []; // Instances of connected and working function modules
        this.attachedFunctionModuleModelNumber = []; // Modal name (strings) of function modules attached to each port of the core, not necessarily connected or in use.

        // Static list of TCoreModule indexed by SN
        if (typeof TCoreModule.instances == 'undefined') TCoreModule.instances = {};
        if (data.sn) TCoreModule.instances[data.sn] = this; // [!] Need to save it when it is connected by finding a certain function module instead of given sn / address

        // if (data.functionModuleData) this.connectToCoreModule(data.functionModuleData);
    }

    // Connect to the core module
    // @param functionModuleData (object) Address, port, modelNumber, etc.
//     connectToCoreModule (functionModuleData) {
//
//         var ble = Bluetooth.instance;
//         if (!ble) return;
// //        console.error('- connectToCoreModule', functionModuleData);
//         var instance = this;
//         this.data.address = functionModuleData.address;
//         instance.connectToModule();
//
//     }

    static findCoreInstanceBySN (sn) {
        if (!sn) return;
        for (var n in TCoreModule.instances) {
            if (TCoreModule.instances[n] && TCoreModule.instances[n].sn == sn) {
                return TCoreModule.instances[n];
            }
        }
    }

    removeCoreInstance () {
        this.__isCoreRemoved = true; // To prevent OS from auto-resuming the connection when hardware is back online
        console.log('TCoreModule.removeCoreInstance ' + this.__isCoreRemoved);
        for (var n in TCoreModule.instances) {
            if (TCoreModule.instances[n] && TCoreModule.instances[n].data.uniqueID == this.data.uniqueID) {
                TCoreModule.instances.splice(n, 1);
            }
        }
        clearInterval(this.connectToModuleIntervalID);
        // clearTimeout(this.connectToCoreModuleIntervalID);
    }

    // Methods of connecting / disconnecting function modules

    // Find a port that is attached to a certain model of function module but is not connected or in use
    // Typically caused by a TFuntionModule with only model name given without knowing the port attached to it. When the qualified TCoreModule is found and connected, the TFunctionModule instance need to find the port ID and claim it by calling __connectToPort()
    // @param modelNumber (string) e.g. 'i1'
    findConnectablePortByModelNumber (modelNumber) {
        if (!this.isDeviceConnected()) return;
        if (typeof options != 'object') options = {};
        for (var n in this.attachedFunctionModuleModelNumber) {
            if (this.attachedFunctionModuleModelNumber[n] == modelNumber && !this.connectedFunctionModuleInstances[n]) return n;
        }
    }

    // @param options (object)
    // - address (string) Find a hardware module with a specific address if given
    static findConnectablePortByModelNumber (modelNumber, options) {
        if (!Bluetooth.instance) return;
        if (typeof options != 'object') options = {};
//        console.log('TCoreModule.findConnectablePortByModelNumber', modelNumber);
        var port;
        for (var n in Bluetooth.instance.foundDeviceList) {
            var d = Bluetooth.instance.foundDeviceList[n];
            if (options.address) {
                // No restriction to RSSI range if address is given
                if (d.modelNumber == modelNumber && options.address == d.address) return d;
            } else {
                // Restrict to RSSI range by default
                if (d.modelNumber == modelNumber && Bluetooth.isWithinRange(d.rssi)) return d;
            }
        }
    }

    // Overridable internal routine performed when device is connected
    // Subscribe to port changes when function modules are attached / detached
    // @param device (object) Instance of BluetoothDevice
    __onDeviceConnect (device) {
        super.__onDeviceConnect(device)
        // console.log('TCoreModule.onDeviceConnect ' + this.__isCoreRemoved);
        var instance = this
        this.requestAttachedModules() // Start subscribing for port changes
        this.subscribeForAttachedModules(true)
        this.data.port = 1 // Only port 1 is implemented to the hardware upto 2019
    }

    // Overridable private callback invoked when device is physically disconnected
    // Disconnect function modules in use. Decrease the total connectable function module number.
    __onDeviceDisconnect (device) {
        super.__onDeviceDisconnect(device)
        // Invoke onDeviceConnect() callback of the function module
        // for (let m of this.connectedFunctionModuleInstances) {
        //     if (m) m.detachFromCoreModule()
        // }
    }

    // Request for periodical port data update
    // @param subscribe (boolean) If to subscribe or to unsubscribe
    subscribeForAttachedModules (subscribe) {
//        console.log('subscribeForAttachedModules');
        if (subscribe) {
            if (!this.subscribeForAttachedModulesIntervalID) {
                this.requestAttachedModules(); // Call for once immediately
                this.subscribeForAttachedModulesIntervalID = setInterval (() => {this.requestAttachedModules()}, TCoreModule.PORT_CHECKING_INTERVAL);
            }
        } else if (this.subscribeForAttachedModulesIntervalID) {
            clearInterval(this.subscribeForAttachedModulesIntervalID);
            delete this.subscribeForAttachedModulesIntervalID;
        }
    }

    requestAttachedModules () {
        // console.log('requestAttachedModules');
        if (this.isDeviceConnected()) {
            this.write(0, 0, TModule.COMMAND_CHECK_PORTS);
        }
    }

    // Monitor the change of all ports from the BLE subscription result
    onBLENotify (v) {
        super.onBLENotify (v); // Must call the super method first!
        var model = v[6];
        var port = v[7];
        var command = v[8];
       // console.log('TCoreModule.onBLENotify model=' + model + ' port=' + port + ' command=' + command + ' value=', v);
        if (command == TModule.COMMAND_GET_SERIAL_NUMBER) {
            // Copy serial number of core module to function modules
            for (var port in this.connectedFunctionModuleInstances) {
                var m = this.connectedFunctionModuleInstances[port];
                if (m) {
                    m.data.sn = this.data.sn;
                    m.data.shortSN = this.data.shortSN;
                }
            }
        } else if (model == 0 && command == TCoreModule.COMMAND_CHECK_PORTS) {
            let portModleNumber = rawDataToModelNumber(v[9])
            console.log('Port change', portModleNumber, '->', this.data.modelNumber)
            if (!this.matchesPossibleModelNumbers(portModleNumber)) { // Connected to the wrong module
                console.log('Port detached')
                this.disconnectDevice(!Compatibility.supportsCordovaBluetooth()) // Keep auto-reconnect in Cordova mode
            }
//            console.log('Function module changed', v[9], v[10], v[11], v[12]);
        } else if (port) {
            // Function module data communication
            if (this.connectedFunctionModuleInstances[port]) this.connectedFunctionModuleInstances[port].onBLENotify(v);
        }

        // Convert raw port data to model number
        function rawDataToModelNumber (data) {
            if (data != 255) return data;
        }

    }

    // Update the total number of connectable function modules (connected to cores but not attached to a TFunctionModule instance)
    static updateConnectableFunctionModulesByModelNumber (modelNumber, inc) {
        if (!modelNumber || modelNumber == 0xff) return;
        if (typeof inc != 'number') inc = 1;
        // Static list of connectableFunctionModules indexed by modelNumber
        if (typeof TCoreModule.connectedFunctionModulesByModelNumber == 'undefined') TCoreModule.connectedFunctionModulesByModelNumber = {};
        if (typeof TCoreModule.connectedFunctionModulesByModelNumber[modelNumber] == 'undefined') TCoreModule.connectedFunctionModulesByModelNumber[modelNumber] = 0;
        TCoreModule.connectedFunctionModulesByModelNumber[modelNumber] += inc;
//        console.error(inc + ' -> ' + TCoreModule.connectedFunctionModulesByModelNumber[modelNumber]);
    }

    // Get the total number of connectable function modules
    static getConnectableModulesByModelNumber (modelNumber) {
        if (isNaN(modelNumber)) return 0;
        if (TCoreModule.connectedFunctionModulesByModelNumber && TCoreModule.connectedFunctionModulesByModelNumber[modelNumber]) {
            return TCoreModule.connectedFunctionModulesByModelNumber[modelNumber];
        } else {
            return 0;
        }
    }

}

TCoreModule.instances = []
TCoreModule.COMMAND_CHECK_PORTS = 0x00
TCoreModule.PORT_CHECKING_INTERVAL = 2000
//TCoreModule.COMMAND_CHECK_PORTS_DEPRECATED = 0x80
