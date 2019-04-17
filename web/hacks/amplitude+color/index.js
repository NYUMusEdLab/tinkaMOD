// Simple app that uses amplitude to control position and a color sensor
// to control color of an ellipse

// in web: python -m SimpleHttpServer
// http://127.0.0.1:8000/hacks/amplitude+color/

// Bug - the tinkamo has to be disconnected for sensor values to appear

let mic;
let colorArray = {r:255, g:255, b:255};
let backgroundColor = {r:0, g:0, b:0};
let buttonFlag = 1;

function setup(){
    let canvas = createCanvas(100, 100);
    canvas.parent('frame');
    mic = new p5.AudioIn()
    mic.start();
}

function draw(){
    background(backgroundColor.r, backgroundColor.g, backgroundColor.b);

    // Sensor readings
    getTinkaColor();
    micLevel = mic.getLevel();

    // Virtual draw
    fill(colorArray.r, colorArray.g, colorArray.b);
    ellipse(width/2, constrain(height-micLevel*height*5, 0, height), 10, 10);
}

function startAudio() {
    getAudioContext().resume();
}

function getTinkaColor() {
    let tinkaList = Object.values(tinkacores);

    if (tinkaList.length > 0) {
        let tinkaObj = tinkaList[0];
        if (tinkaObj.reading.color) {
            backgroundColor.r = tinkaObj.reading.color[0];
            backgroundColor.g = tinkaObj.reading.color[1];
            backgroundColor.b = tinkaObj.reading.color[2];
        }

    }
    if (tinkaList.length > 1) {
        let tinkaObj2 = tinkaList[1];

        if (tinkaObj2.reading.button && buttonFlag) {
            colorArray.r = random(0, 255);
            colorArray.g = random(0, 255);;
            colorArray.b = random(0, 255);;
            buttonFlag = 0;
        }
        else if (!tinkaObj2.reading.button) {
            buttonFlag = 1;
        }
    }
    return colorArray;
}
