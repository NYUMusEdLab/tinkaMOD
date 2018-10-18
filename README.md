# Tinkamo Meets Music
Quick and dirty tool for connecting to [Tinkamo](https://www.tinkamo.com) blocks via bluetooth, and then deciphering/forwarding the messages via OSC such that they can be used in other applications like Max MSP and Processing. This includes a few examples.

### Installation
This relies on [noble.js](https://github.com/noble) for bluetooth and [osc.js](https://www.npmjs.com/package/osc) for osc messages.  

```
$ npm install noble
$ npm install osc
```

Then, navigate to the project directory and run the `go.js` to begin listening, translating and sending messages from the Tinkamo objects.

```
$ node go.js
OSC Ready
Skipping 'undefined' 84764afb401042a48434e743a1b2a0d0
Connecting to 'Tinka' b22a0fe77dd04170aedd151daa77ba68
Discovering services & characteristics
Subscribed to notifications
Knob: 8.755328218243818
Knob: 9.869281045751631
Knob: 9.982949701619777
Connection: none
Connection: color
Color: (r: 255), (g: 144), (b: 121)
...
```

Finally, `tinkamo->max.maxpat` is setup to receive and send these messages across any of your new/existing max patches.

### Supported Sensors
```
Connection:
    ID: 0
    Output: [0|1], string containing name of sensor attached
    OSC Address: /tinkamo/connection

Button:
    ID: 1
    Output: [0|1]
    OSC Address: /tinkamo/button

Knob:
    ID: 2
    Output: float ranging from -10 to 10
    OSC Address: /tinkamo/knob

Slider:
    ID: 3
    Output: float ranging from 0 to 10
    OSC Address: /tinkamo/slider

Joystick:
    ID: 4
    Output: horizontal float, vertical float ranging from -10 to 10
    OSC Address: /tinkamo/joystick

Distance:
    ID: 23
    Output: float ranging from 0 to 20
    OSC Address: /tinkamo/distance

Color:
    ID: 27
    Output: red int, green int, blue int ranging from 0 to 255
    OSC Address: /tinkamo/color
```
