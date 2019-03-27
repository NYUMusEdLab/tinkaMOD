# Tinkamo Bluetooth Protocols

![](tinkamo-ble-brotocol-data-format.png)

The protocol is made of a fixed header, the gray part, and a various body, the orange part.

## Motor
![](motor-protocol-data-format.png)

![](motor-sample-data.png)
The sample BLE command string above lets the motor spin in full speed (Hex: 03 E8 or Oct: 1000) in counter-clockwise direction (FF).

## Servo
![](servo-protocol-data-format.png)

![](servo-sample-data.png)
The sample BLE command string above lets the servo rotate to the right extreme (Hex: 5A or Oct: 180).
