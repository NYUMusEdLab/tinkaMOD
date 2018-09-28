// Willie Payne
// go.js
// This file serves as the go-between between Tinkamo and any computer
// applications running OSC. It connects to a Tinkamo device via Bluetooth and
// then translates and forwards all messages it understands via OSC.

// Issues
// If Tinkamo Block gets disconnected - this won't reconnect until restart.
// Where should the udp ready and noble discover functions fit?
// The potentiometers send a short unknown message sometimes, length 7
// This will only work with one Tinkamo Brain

const noble = require('noble');
const osc = require('osc');
const TinkaCore = require('./tinkacore.js');

const deviceName = 'Tinka';
const udpListen = 4444;
const udpSend = 4445;
const localAddr = "0.0.0.0"

let tinkacores = {}; // Object to hold all tinkacores
TinkaCore.core_ids = {
    connected: new Set([]),
    disconnected: new Set([])
};

// Create an osc.js UDP Port listening on port 44444.
const udpPort = new osc.UDPPort({
    localAddress: localAddr,
    localPort: udpListen,
    metadata: true
});

// Start scanning for Bluetooth devices
noble.on('stateChange', state => {
    if (state === 'poweredOn') {
        noble.startScanning([], true); // Allow duplicates
    } else {
        noble.stopScanning();
    }
});

// Turn OSC on and once ready attempt to connect to Tinkamo Devices
udpPort.open();
udpPort.on("ready", function () {
    console.log('OSC Ready');
    noble.on('discover', peripheral => {
        let found_name = peripheral.advertisement.localName;
        let found_id = peripheral.id;

        if (found_name === deviceName) {
            // noble.stopScanning();
            // console.log(tinkacores);
            add_tinkacore(peripheral);
            // console.log(`Connecting to '${found_name}' ${found_id}`);

        }
    });
});

function add_tinkacore(peripheral) {
    // console.log('here');
    // console.log(tinkacores);
    console.log(Object.keys(tinkacores).length);
    let found_id = peripheral.id
    if (!(TinkaCore.core_ids.connected.has(found_id))) {
        tinkacores[found_id] = new TinkaCore(peripheral);
        tinkacores[found_id].connect();
        return
    }
    else if (TinkaCore.core_ids.disconnected.has(found_id)) {
        tinkacores[found_id].connect();
    }
    return;
}
