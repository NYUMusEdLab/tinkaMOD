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
const TinkaMess = require('./tinkamess.js');
const TinkaCore = require('./tinkacore.js');

const deviceName = 'Tinka';
const udpListen = 4444;
const udpSend = 4445;
const localAddr = "0.0.0.0"

// Create an osc.js UDP Port listening on port 44444.
const udpPort = new osc.UDPPort({
    localAddress: localAddr,
    localPort: udpListen,
    metadata: true
});

// Start scanning for Bluetooth devices
noble.on('stateChange', state => {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

// Turn OSC on and once ready attempt to connect to Tinkamo Devices
udpPort.open();
udpPort.on("ready", function () {
    console.log('OSC Ready');
    noble.on('discover', peripheral => {
        foundName = peripheral.advertisement.localName;
        if (peripheral.advertisement.localName === deviceName) {
            console.log(`Connecting to '${foundName}' ${peripheral.id}`);
            let tinkacore = new TinkaCore(peripheral);
            tinkacore.connect();
            noble.stopScanning();
        } else {
            console.log(`Skipping '${foundName}' ${peripheral.id}`);
        }
    });
});
