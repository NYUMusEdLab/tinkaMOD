// https://github.com/processing/p5.js/wiki/Global-and-instance-mode
let frame =  document.getElementById('frame');
editor = ace.edit("editor");
editor.setTheme("ace/theme/clouds");
editor.session.setMode("ace/mode/javascript");
let output;

let default_sketch = function(s) {
    s.setup = function() {
        s.createCanvas(100, 100);
        s.background(200);
    }
}

getCode = function() {
    if (output) {output.remove();}
    let code;

    try {
        code = eval(editor.getValue());
    } catch (e) {
        console.log('Some kind of error');
        code = default_sketch;
    }
    try {
        output = new p5(code, frame);
    } catch (e) {
        console.log(e);
        stopCode();
    }

}

stopCode = function() {
    removeAll();
    output = new p5(default_sketch, frame);
}

removeAll = function() {
    while (frame.firstChild) {
        frame.removeChild(frame.firstChild);
    }
}


/*
sketch = function(s) {
    let x = 100;
    let y = 100;

    s.setup = function() {
        s.createCanvas(x, y);
        s.background(s.random(200))
    };
}

sketch;
*/

/*
sketch = function(s) {
    let x = 1400;
    let y = 100;

    s.setup = function() {
        s.createCanvas(x, y);
        s.background(230);
    };

    s.draw = function() {
        s.background(250);
        let tinkaList = Object.values(tinkacores);
        if (tinkaList.length > 0) {
            let tinkaObj = tinkaList[0];
            if (tinkaObj.reading.color) {
                let r = tinkaObj.reading.color[0];
                let g = tinkaObj.reading.color[1];
                let b = tinkaObj.reading.color[2];
                s.background(r,g,b);

            }
            s.text(JSON.stringify(tinkaObj), 10, 30);
        }
        else {
            s.text('None', 10, 30);
        }
    };
}

sketch;
*/
