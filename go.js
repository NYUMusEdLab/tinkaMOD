const noble = require('noble');
const TinkaMess = require('./tinkamess.js');

const deviceName = 'Tinka';

noble.on('stateChange', state => {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

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

function connectAndSetUp(peripheral) {
    peripheral.connect(function(error) {
        console.log('Discovering services & characteristics');
        peripheral.discoverAllServicesAndCharacteristics(onConnect);
    });
    peripheral.on('disconnect', () => console.log('disconnected'));
}

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

    attempt.on('data', (data, isNotification) => {
        dataFile = data.toJSON().data;
        let tinkamess = new TinkaMess(dataFile);
        tinkamess.send();
        //console.log(dataFile, dataFile.length);
    });
}
