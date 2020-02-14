import Tinkamo from "./tinkacode/tinkamo.js";

let currentHost = "localhost:12345";
let oscWebSocket;

let tinkamo = new Tinkamo();

// OSC Web Socket Functions
window.onConnectClick = function() {
    try {
    oscWebSocket = new osc.WebSocketPort({
      url: "ws://" + currentHost,
      metadata: true
    });

    oscWebSocket.on("ready", onSocketOpen);
    //oscWebSocket.on("message", onSocketMessage);
    oscWebSocket.on("error", function(e){
      print(e.message);
    });

    oscWebSocket.open();
  } catch(e) {
    print(e);
  }
}

window.onSocketOpen = function() {
    console.log("OSC Connection made");
}

// Tinkamo Functions
window.onAddTinkamo = function() {
    tinkamo.connect();
}

// Edit this function if you want to change how the OSC message
// gets sent.
// Or add specific listeners to connect/disconnect messages
tinkamo.addEventListener('connect', function(event) {
    event.tinkacore.addEventListener('*', function(tinkamoEvent) {
        let address = `/tinkamo/${tinkamoEvent.sensor}`;
        let args = [
            {type: "s",value: tinkamoEvent.type},
            {type: "s",value: JSON.stringify(tinkamoEvent.value)},
        ];

        oscWebSocket.send({
            address: address,
            args: args
        });
    })
})
