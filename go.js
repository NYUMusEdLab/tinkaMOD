// Willie Payne
// go.js
// This file serves as the go-between between Tinkamo and any computer
// applications running OSC. It connects to a Tinkamo device via Bluetooth and
// then translates and forwards all messages it understands via OSC.

// Issues
// The potentiometers send a short unknown message sometimes, length 7

const noble = require('noble');
const osc = require('osc');
const TinkaCore = require('./tinkacore.js');

const deviceName = 'Tinka';
const udpListen = 4444;
const udpSend = 4445;
const localAddr = "0.0.0.0";

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
    let found_id = peripheral.id;
    if (TinkaCore.core_ids.disconnected.has(found_id)) {
        delete tinkacores[found_id]; // Does not work...
        tinkacores[found_id] = new TinkaCore(peripheral, {
            udp_port: udpPort,
            local_address: localAddr,
            udp_send: udpSend,
            udp_listen: udpListen // Not used for tinkacores yet
        });
        tinkacores[found_id].connect();
    }
    else if (!(TinkaCore.core_ids.connected.has(found_id))) {
        tinkacores[found_id] = new TinkaCore(peripheral, {
            udp_port: udpPort,
            local_address: localAddr,
            udp_send: udpSend,
            udp_listen: udpListen // Not used for tinkacores yet
        });
        tinkacores[found_id].connect();
    }
    return;
}
