# Tinkamo + Javascript
**TinkaMOD** is a rapid prototyping environment for building interactive controllers and instruments with [Tinkamo](https://tinkamo.com) and Javascript all without any wires or serial communication or other complexities. Everything runs in the browser thanks to recent [Chrome Bluetooth](https://developer.chrome.com/apps/bluetooth) support.

[**Connect your Tinkamo with our interactive Getting Started Doc.**](https://nyumusedlab.github.io/tinkaMOD/)

[**Read the generated docs.**](https://nyumusedlab.github.io/tinkaMOD/JSDoc/)

## Installing the API
First, install the libary using [npm](https://www.npmjs.com) or download the files included in the source folder of this repository.
```
npm i @musedlab/tinkamod
```

Then, create scripts containing HTML and Javascript code in your project and include the Tinkamo library. For instance, if you included the source code in a 'tinkaMOD' folder and titled your scripts index.html and index.js, you may use the following:

In `index.html` - include your index.js file as a module in the body of your document.
```html
<script type="module" src="index.js"></script>
```

In `index.js` - import Tinkamo from tinkamo.js. (This is the only class you'll need.)
```javascript
import Tinkamo from "tinkaMod/tinkamo.js";
```

## Connecting a Tinkamo Core
To connect Tinkamo cores to your application, use `connect()` method. However, due to Chrome security requirements, this method can only be called upon user action. For instance:

In index.html - create a button that calls the `onConnectionCallback` function.
```html
<button onclick="onConnectionCallback()">CONNECT TINKAMO</button>
```

In index.js - use `connect()` once the user presses the button.
```javascript
let tinkamo = new Tinkamo();
onConnectionCallback = function() { tinkamo.connect(); }
```

## Using Tinkamo in your Project
Our API primarily allows you to create custom events when Tinkamo sensors take readings of the world.
* The `Tinkamo` class acts like a container or bucket storing all connected Tinkamo cores enabling you to form new connections, and set up custom events when a Tinkamo core is connected or disconnected. It contains a list of Tinkamo cores that you can retrieve at any time with the `getTinkamoList()` method.
* The `TinkaCore` class is used as instances referring to physical Tinkamo cores. It is the primary class for doing things like playing sounds or adjusting animations when sensors attached to the Tinkamo core send messages to the computer via bluetooth.

For instance, if I wanted to simply log some information each time a sensor picks up a reading on the world, I might set up the following event listeners.

In index.html - we'll use the same button:
```html
<button onclick="onConnectionCallback()">CONNECT TINKAMO</button>
```

In index.js - we'll call connect again, but also set up appropriate events.
```javascript
let tinkamo = new Tinkamo();

// First, add event listeners to all Tinkamo cores that get connected
tinkamo.addEventListener('connect', function(tinkamoEvent) {
    let connectedTinkaCore = tinkamoEvent.tinkacore;

    // Print some information when a tinkacore sends a 'reading' message.
    connectedTinkaCore.addEventListener('reading', function(tinkacoreEvent) {
        console.log(tinkacoreEvent.sensor, tinkacoreEvent.value)
    });
});

onConnectionCallback = function() { tinkamo.connect(); }
```

## Supported Events
Event types are passed into the `addEventLister()` function as a string. For instance, if you pass "\*" as an argument you can subscribe to all events triggered by a `Tinkamo` or `TincaCore` instance.

### Tinkamo Events
* "\*"
* "connect"
* "disconnect"

Each `event` argument is an object with the structure:
```
{  
    type: 'disconnect' or 'connect',
    tinkacore: tinkacore instance that has just been connected/disconnected,
    tinkamo: reference to the tinkamo instance that triggered the event
}
```

### TinkaCore Events
* "\*"
* "sensor change"
* "reading"
* "button", "knob", "slider", "joystick", "distance", "color"

Each `event` argument is an object with the structure:
```
{
    type: string referring to the type of event,
    sensor: string containing the name of the current sensor,
    value: depends on the event ranging from boolean to number array,
    tinkacore: reference to the tinkacore instance that triggered the event
}
```

## Supported Sensors and Output Ranges
* Button: 0 | 1
* Knob: float ranging from -10 to 10
* Slider: float ranging from 0 to 10
* Joystick: [horizontal float, vertical float] ranging from -10 to 10
* Distance: float ranging from about 0 to 30
* Color: [red int, green int, blue int] ranging from 0 to 255

## Contributing
This project is primarily developed by NYU students as part of the [Vertically Integrated Projects (VIP) program](https://wp.nyu.edu/vip/).

**Building the example doc:** `$ npm run doc`

**Contributing to the example:** `$ npm run example`
