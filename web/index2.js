let tinkaServiceName = 0xfffa;
var slider = document.getElementById('slider')

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
	    console.log(characteristics)
            characteristics[0].startNotifications()
            characteristics[0].addEventListener('characteristicvaluechanged',
						handleChange);
            console.log('Notifications have been started.');
	    //0-4
	    //0-255
	    slider.oninput = function() {
		var speed = parseInt(this.value, 10)
		if( speed < 0 ){
		    d = 0;
		    speed *= -1;
		}
		else{ d = 255; }
		var x = Math.floor(speed/255) //+1 <- never goes to 0
		var y = speed % 255
		var motor = new Uint8Array([90,171,10,0,0,2,5,0,0,d,x,y])
		characteristics[1].writeValue(motor);
	    }
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

function stop_motor(event) {
    slider.value = 0
    //doesn't work yet
}
