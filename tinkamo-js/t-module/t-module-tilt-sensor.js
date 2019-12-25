/*
 * HTML5 Tilt Sensor Hardware Classes
 * Project Tinkamo
 * http://tinkamo.com
 *
 * Copyright 2018-2019 Tinkamo
 * Rev 2019-05-19 By Jam Zhang
 */

// -----------------------------------------------------------------------------
// TModuleTiltSensor Class V0.6
// With dynamic preference.parameterRange
//
// API
// Callback: onValue(value)
// Events:
// Type 'left', 'right', 'up', 'down' with no value
// Type 'value' with value:
// - x, y (int) [-10, 10] Acceleration component value of each axis
// - dir (string) Made up of 'l7, 'r', 'd', 'u' and indicates the directions
// -----------------------------------------------------------------------------

class TModuleTiltSensor extends EventDispatcher {
    constructor() {
        super()
        this.deviceMotiionListener = null
        if (window.Accelerometer) { // Not supported on iOS
            this.accelerometer = new Accelerometer({frequency: 60})
            this.accelerometer.addEventListener('reading', e => {
                console.log(e);
              console.log("Acceleration along the X-axis " + accelerometer.x);
              console.log("Acceleration along the Y-axis " + accelerometer.y);
              console.log("Acceleration along the Z-axis " + accelerometer.z);
            });
        }
        this.resume()
        window.TILT_M = this
    }

    // deviceMotionHandler(e) {
    //   console.info(e.acceleration, e.accelerationIncludingGravity)
    // }

    parseAccelerometerData(deviceInput) {
        const r = 10
        const G = 9.8 // Gravity acceleration constant
        const acceleration = {
            x: 0,
            y: 0,
            z: 0
        } // [-100, 100] for x/y/x

        if (deviceInput && deviceInput.x) {
            const a = deviceInput
            // console.info('aa:', a)
            switch (window.orientation) {
                case 0: // Portrait
                    acceleration.x = Math.min(r, Math.max(-r, Math.round((a.x * r) / G)))
                    acceleration.y = -Math.min(
                        r,
                        Math.max(-r, -Math.round((a.y * r) / G))
                    )
                    break
                case 180: // Reverse Portrait
                    acceleration.x = -Math.min(r, Math.max(-r, Math.round((a.x * r) / G)))
                    acceleration.y = Math.min(r, Math.max(-r, -Math.round((a.y * r) / G)))
                    break
                case -90: // Landscape Right
                    acceleration.x = Math.min(r, Math.max(-r, Math.round((a.y * r) / G)))
                    acceleration.y = Math.min(r, Math.max(-r, -Math.round((a.x * r) / G)))
                    break
                case 90: // Landscape Left
                    acceleration.x = -Math.min(r, Math.max(-r, Math.round((a.y * r) / G)))
                    acceleration.y = -Math.min(
                        r,
                        Math.max(-r, -Math.round((a.x * r) / G))
                    )
                    break
            }
        }

        return acceleration
    }

    dispatch(acceleration) {
        const dirH = ''
        const dirV = ''
        if (acceleration.x < -25) {
            dirH = 'l'
            this.dispatchEvent({
                type: 'left'
            })
        } else if (acceleration.x > 25) {
            dirH = 'r'
            this.dispatchEvent({
                type: 'right'
            })
        }
        if (acceleration.y < -50) {
            dirV = 'd'
            this.dispatchEvent({
                type: 'down'
            })
        } else if (acceleration.y > 40) {
            dirV = 'u'
            this.dispatchEvent({
                type: 'up'
            })
        }

        // Simply tilt iPad left or right will move forward and turn
        if (dirH.length && !dirV.length) {
            dirV = 'u'
            this.dispatchEvent({
                type: 'left'
            })
        }

        acceleration.dir = dirH + dirV
        //   console.info('aaa:', acceleration)
        this.dispatchEvent({
            type: 'value',
            value: acceleration
        })
    }

    accelerometerSuccess(res) {
        const {
            x = 0, y = 0, z = 0
        } = res
        const acceleration = this.parseAccelerometerData({
            x: -x,
            y: -y,
            z: -z
        })
        // console.log('acceleration:', acceleration, window.orientation)
        this.dispatch(acceleration)
    }

    accelerometerError() {}

    // Resume monitoring the accelerometer
    resume() {
        let instance = this
        if (!(window.DeviceMotionEvent || navigator.accelerometer)) {
            this.pause()
            return
        }
        // console.log('Tilt sensor resumed');
        this.isPaused = false
        if (navigator.accelerometer) { // Cordova accelerometer plugin. Deprecated in 9.x
            this.deviceMotiionListener = navigator.accelerometer.watchAcceleration(
                this.accelerometerSuccess.bind(this),
                this.accelerometerError.bind(this), {
                    frequency: 100
                }
            )
        } else if (this.accelerometer) {
            this.accelerometer.start()
        } else if (window.DeviceMotionEvent) { // iOS web motion event
            this.deviceMotiionListener = function (e) {
                // console.log(e);
                e = e.accelerationIncludingGravity
                instance.dispatchEvent({
                    type: 'value',
                    value: instance.parseAccelerometerData(e)
                })
            }
            window.addEventListener('devicemotion', this.deviceMotiionListener)
        }
    }

    // Stop monitoring the accelerometer
    pause() {
        // console.log('Tilt sensor paused');
        this.isPaused = true
        if (navigator.accelerometer) { // Cordova accelerometer plugin. Deprecated in 9.x
            navigator.accelerometer.clearWatch(this.deviceMotiionListener)
        } else if (this.accelerometer) {
            this.accelerometer.stop()
        } else if (window.DeviceMotionEvent) { // iOS web motion event
            if (this.deviceMotiionListener) {
                window.removeEventListener('devicemotion', this.deviceMotionHandler)
                delete this.deviceMotiionListener
            }
        }
        this.dispatchEvent({
            type: 'value',
            value: {
                x: 0,
                y: 0,
                z: 0,
                dir: ''
            }
        })
    }
}
