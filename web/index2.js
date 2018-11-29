let tinkaServiceName = 0xfffa;

function connect(){
    console.log('Requesting Bluetooth Device...')
    navigator.bluetooth.requestDevice({
	filters : [{
	    name: 'Tinka',
	}],
	optionalServices: [tinkaServiceName]
    })
	.then(device => {
	    console.log('> Found ' + device.name);
	    console.log('> Id: ' + device.id);
	    console.log('> Connected: ' + device.gatt.connected);
	    device.addEventListener('gattserverdisconnected', onDisconnected);
	    return device.gatt.connect() //device.gatt.disconnect()
	})
	.then(server => {
        console.log(server);
	    return server.getPrimaryService(tinkaServiceName);
	})
    .then(service => {
        console.log('Tinka services...');
        console.log(service);
        return service.getCharacteristics();
    })
    .then(characteristics => {
        let characteristic = characteristics[0];
        return characteristic;
    })
    .then(characteristic => characteristic.startNotifications())
    .then(characteristic => {
        characteristic.addEventListener('characteristicvaluechanged',
                                  handleChange);
        console.log('Notifications have been started.');
    })
	.catch(error => {
	    console.log("ERROR: " + error);
	});
}

function handleChange(event) {
    // Produces the same array as used in the Node code
    let buff = new Uint8Array(event.target.value.buffer);
    console.log(buff);
}

function onDisconnected(event) {
  let device = event.target;
  console.log('Device ' + device.name + ' is disconnected.');
}
