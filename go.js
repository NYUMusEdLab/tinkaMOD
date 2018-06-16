// Willie Payne
// go.js
// This file serves as the go-between between Tinkamo and any computer
// applications running OSC. It connects to a Tinkamo device via Bluetooth and
// then translates and forwards all messages it understands via OSC.

// Currently Supports
//      Connection
//      Button
//      Distance

// Issues
// If Tinkamo Block gets disconnected - this won't reconnect until restart.
// Where should the udp ready and noble discover functions fit?
// This will only work with one Tinkamo Brain

const noble = require('noble');
const osc = require('osc');
const TinkaMess = require('./tinkamess.js');

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
            connectAndSetUp(peripheral);
            noble.stopScanning();
        } else {
            console.log(`Skipping '${foundName}' ${peripheral.id}`);
        }
    });
});

// Connect to the Tinkamo device
function connectAndSetUp(peripheral) {
    peripheral.connect(function(error) {
        console.log('Discovering services & characteristics');
        peripheral.discoverAllServicesAndCharacteristics(onConnect);
    });
    peripheral.on('disconnect', () => console.log('disconnected'));
}

// Once connected, attempt to subscribe to messages it puts out.
function onConnect(error, services, characteristics) {
    if (error) {
        console.log('Error discovering services and characteristics ' + error);
        return;
    }

    var attempt = characteristics[0];

    attempt.subscribe((err) => {
        if (err) {
            console.log('Error subscribing to notifications', err);
        } else {
            console.log('Subscribed to notifications');
        }
    });

    // Uses the TinkaMess class to convert the buffer into a usable message
    attempt.on('data', (data, isNotification) => {
        dataFile = data.toJSON().data; // Convert buffer to JSON
        //console.log(dataFile, dataFile.length);

        let tinkamess = new TinkaMess(dataFile);
        let formedMessage = tinkamess.formMessage();

        if (formedMessage != false) {
            udpPort.send(formedMessage, localAddr, udpSend);
            console.log(`Sent message to ${formedMessage.address}`);
        }
    });
}
