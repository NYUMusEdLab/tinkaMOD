
function connect(){
    console.log('Requesting Bluetooth Device...')
    navigator.bluetooth.requestDevice({
	filters : [{
	    name: 'Tinka'
	}],
	//acceptAllDevices: true ,
    })
	.then(device => {
	    console.log('> Found ' + device.name);
	    console.log('> Id: ' + device.id);
	    console.log('> Connected: ' + device.gatt.connected);
	    device.addEventListener('gattserverdisconnected', onDisconnected);
	    return device.gatt.connect() //device.gatt.disconnect()
	})
	.then(server => {
	    console.log('Tinka services...');
	    //https://www.bluetooth.com/specifications/gatt/characteristics
	    return service.getPrimaryService();
	})
	.catch(error => {
	    console.log("ERROR: " + error);
	});
}


function onDisconnected(event) {
  let device = event.target;
  console.log('Device ' + device.name + ' is disconnected.');
}
