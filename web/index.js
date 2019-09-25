// Tinkamo - Interactive getting started guide
// Willie Payne
// 2019

// Variables to use in demo code
let tinkamo = new Tinkamo();
let tinka0;
let alertText = "Oops - Please make sure to connect a Tinkamo before trying one of the examples."

// HTML Elements to interact with
let connectionButton = document.getElementById('connectionButton');
let example1 = document.getElementById('example1');
let example2 = document.getElementById('example2');
let example3 = document.getElementById('example3');
let example4 = document.getElementById('example4');
let example5 = document.getElementById('example5');
let volumeSlider = document.getElementById('volume_slider');

// Variables for Tone example
let sound = false;
Tone.context.latencyHint = 'fastest';
let outputVol = new Tone.Volume(-100);
outputVol.mute = true;
let synth = new Tone.Synth().chain(outputVol, Tone.Master);
// let synth = new Tone.Synth().toMaster();
let pitches = ['F3', 'A3', 'A#3', 'C4', 'E4',
               'F4', 'A4', 'A#4', 'C5', 'E5', 'F5'];
let randomGenerator = new Tone.CtrlRandom({
	'min': 0,
	'max': pitches.length,
	'integer': true
});

volumeSlider.oninput = function() {
    if (this.value == -20) {
        outputVol.mute = true;
    }
    else {
        outputVol.mute = false;
        outputVol.volume.rampTo(this.value, 0.01);
    }
}

// Callback functions
let onConnectionCallback = function() {
    if (Tone.context.state !== 'running') {
        Tone.context.resume();
    }
    tinkamo.connect(function(tinkacore) {
        // Set up event listeners used as examples.
        if (tinkacore.name == 'tinka0') {
            tinka0 = tinkacore;
            e3();
            e4();
            e5();
        }
        connectionButton.className = "waves-effect waves-light btn-large blue darken-1"
        connectionButton.innerHTML = "<i class='material-icons left'>bluetooth_connected</i>Connect another one!"
    }, connectionButton);

}

let e1 = function() {
    let tinkaList = tinkamo.getTinkamoList();
    if (!tinkaList.length) {
        alert(alertText);
        return false;
    }

    example1.innerHTML = '';
    for (i in tinkaList) {
        let row = example1.insertRow(i);

        let cell0 = row.insertCell(0);
        let cell1 = row.insertCell(1);
        let cell2 = row.insertCell(2);

        cell0.innerHTML = tinkaList[i].name;
        cell1.innerHTML = tinkaList[i].connected;
        cell2.innerHTML = tinkaList[i].getSensorName();
    }
    return true;
}

let e2 = function() {
    let tinkaList = tinkamo.getByName('tinka0');
    if (!tinkaList.length) {
        alert(alertText);
        return false;
    }

    example2.innerHTML = '';
    for (i in tinkaList) {
        let row = example2.insertRow(i);

        let cell0 = row.insertCell(0);
        let cell1 = row.insertCell(1);
        let cell2 = row.insertCell(2);

        cell0.innerHTML = tinkaList[i].name;
        cell1.innerHTML = tinkaList[i].connected;
        cell2.innerHTML = tinkaList[i].getSensorName();
    }
    return true;
}

let e3 = function() {
    tinka0.onSensorChange(function(event) {
        example3.innerHTML = '';
        let row = example3.insertRow(0);

        let cell0 = row.insertCell(0);
        let cell1 = row.insertCell(1);

        cell0.innerHTML = event.connected;
        cell1.innerHTML = event.sensor;
    });
}

let e4 = function() {
    tinka0.onAnyReading(function(event) {
        example4.innerHTML = '';
        let row = example4.insertRow(0);

        let cell0 = row.insertCell(0);
        let cell1 = row.insertCell(1);

        cell0.innerHTML = event.sensor;
        cell1.innerHTML = event.value;
    });
}

let e5 = function() {
    tinka0.onReading('button', function(value) {
        if (value) {
            let randomPitch = pitches[randomGenerator.value];
            synth.triggerAttack(randomPitch);
            example5.innerHTML = 'button was pressed down';
        }
        else {
            synth.triggerRelease();
            example5.innerHTML = 'button was let up';
        }
    });
}
