// Tinkamo - Interactive getting started guide
// Willie Payne
// 2019

// Variables to use in demo code
let tinkamo = new Tinkamo();
let tinka0;

// HTML Elements to interact with
let connectionButton = document.getElementById('connectionButton');

let onConnectionCallback = function() {
    tinkamo.connect(function() {
        connectionButton.className = "waves-effect waves-light btn-large blue darken-1"
        connectionButton.innerHTML = "<i class='material-icons left'>bluetooth_connected</i>Connect another one!"
    }, connectionButton);

}

/*let tinkaAddButton = document.createElement("input");
tinkaAddButton.type = "button";
tinkaAddButton.value = "Connect";
tinkaAddButton.onclick = function() { tinkamo.connect() };
document.body.appendChild(tinkaAddButton);

let printAllTinka = document.createElement("input");
printAllTinka.type = "button";
printAllTinka.value = "Print All";
printAllTinka.onclick = function() { console.log(tinkamo.getTinkamoList()) };
document.body.appendChild(printAllTinka);

let getTinkaWithName = document.createElement("input");
let tinka0;
getTinkaWithName.type = "button";
getTinkaWithName.value = "Get tinka0";
getTinkaWithName.onclick = function() {
    let tinkas0 = tinkamo.getByName('tinka0');
    if (tinkas0) {
        tinka0 = tinkas0[0];

        // really these should take the event as the first argument to be passed in
        tinka0.onSensorChange(function(event) {
            if (event.connected) {
                console.log('Sensor has changed to:', event.sensor);
            }
            else {
                console.log('No more sensor');
            }
        });
        tinka0.onAnyReading(function(reading) {
            console.log('Callback', reading.sensor, reading.value);
        });
        tinka0.onReading('button', function(value) {
            if (value) { console.log('button was pressed down'); }
            else { console.log('button was let up'); }
        })
    }
};
document.body.appendChild(getTinkaWithName);*/
