/*
* Software Musical Instrument Module Classes
* Project Tinkamo
* http://tinkamo.com
*
* Copyright 2018-2019 Tinkamo
* Rev 2019-07-05 By Jam Zhang
*/


// -----------------------------------------------------------------------------
// TSoftModuleKeyboardInstrument Class
// WebAudio Layer
// -----------------------------------------------------------------------------

class TSoftModuleKeyboardInstrument {

    constructor (soundID) {

        if (isNaN(soundID)) soundID = 0;
        window.PIANO_M = this;
        // Initialize WebAudio
        this.sound = Sound.init();
        this.chooseSound(soundID);
        this.__octave = 0;

    }

    // Start, stop an instrument and play a note
    setKey (key) {
        this.playKey(key);
    }

    // Play a single key
    // @param key (string) Key name such as 'g3', 'f4', 'c5'. or (number) Key index starting from 1, e.g. 1, 2, 3 = 'c3', 'd4', 'e3'
    playKey (key) {
        switch (typeof key) {
            case 'boolean':
                key = key? 'c4': '';
                break;
            case 'number':
                key += this.__octave * 7;
                key = TSoftModuleKeyboardInstrument.NOTES[Math.floor(key-1)];
                break;
            case 'string':
                break;
            default:
                key = '';
                break;
        }
        // if (this.__previousKey != key) {
        //     this.__previousKey = key;
            console.log('playKey', key);
            this.sound.playSoundByName('music-keyboard-' + key);
        // }
    }

    // Raise an octave
    keyDown () {
        this.__octave = 1;
    }

    // Turn off the sound
    keyUp () {
        this.__octave = 0;
    }

    getKeyName (key) {
        var name=TSoftModuleKeyboardInstrument.NOTES[Math.floor(key-1)];
        if (name) name = name.toUpperCase();
        return name;
    }

    chooseSound (soundID) {
        if (this.__currentSound != soundID) {
            this.__currentSound = soundID
            this.sound.loadSoundFiles(TSoftModuleKeyboardInstrument.SOUNDS[soundID])
        }
    }

}

TSoftModuleKeyboardInstrument.NOTES = [
    'c3', 'd3', 'e3', 'f3', 'g3', 'a3', 'b3',
    'c4', 'd4', 'e4', 'f4', 'g4', 'a4', 'b4',
    'c5'
];

TSoftModuleKeyboardInstrument.SOUND_PIANO = 0;
TSoftModuleKeyboardInstrument.SOUND_EPIANO = 1;
TSoftModuleKeyboardInstrument.SOUND_XYLOPHONE = 2;
TSoftModuleKeyboardInstrument.SOUND_GLOCKENSPIEL = 3;

TSoftModuleKeyboardInstrument.SOUNDS = [
    [
        {name: 'music-keyboard-c3', url: 'sound/piano/c3.aac'},
        {name: 'music-keyboard-d3', url: 'sound/piano/d3.aac'},
        {name: 'music-keyboard-e3', url: 'sound/piano/e3.aac'},
        {name: 'music-keyboard-f3', url: 'sound/piano/f3.aac'},
        {name: 'music-keyboard-g3', url: 'sound/piano/g3.aac'},
        {name: 'music-keyboard-a3', url: 'sound/piano/a3.aac'},
        {name: 'music-keyboard-b3', url: 'sound/piano/b3.aac'},
        {name: 'music-keyboard-c4', url: 'sound/piano/c4.aac'},
        {name: 'music-keyboard-d4', url: 'sound/piano/d4.aac'},
        {name: 'music-keyboard-e4', url: 'sound/piano/e4.aac'},
        {name: 'music-keyboard-f4', url: 'sound/piano/f4.aac'},
        {name: 'music-keyboard-g4', url: 'sound/piano/g4.aac'},
        {name: 'music-keyboard-a4', url: 'sound/piano/a4.aac'},
        {name: 'music-keyboard-b4', url: 'sound/piano/b4.aac'},
        {name: 'music-keyboard-c5', url: 'sound/piano/c5.aac'}
    ],
    [
        {name: 'music-keyboard-c3', url: 'sound/arcade/c3.m4a'},
        {name: 'music-keyboard-d3', url: 'sound/arcade/d3.m4a'},
        {name: 'music-keyboard-e3', url: 'sound/arcade/e3.m4a'},
        {name: 'music-keyboard-f3', url: 'sound/arcade/f3.m4a'},
        {name: 'music-keyboard-g3', url: 'sound/arcade/g3.m4a'},
        {name: 'music-keyboard-a3', url: 'sound/arcade/a3.m4a'},
        {name: 'music-keyboard-b3', url: 'sound/arcade/b3.m4a'},
        {name: 'music-keyboard-c4', url: 'sound/arcade/c4.m4a'},
        {name: 'music-keyboard-d4', url: 'sound/arcade/d4.m4a'},
        {name: 'music-keyboard-e4', url: 'sound/arcade/e4.m4a'},
        {name: 'music-keyboard-f4', url: 'sound/arcade/f4.m4a'},
        {name: 'music-keyboard-g4', url: 'sound/arcade/g4.m4a'},
        {name: 'music-keyboard-a4', url: 'sound/arcade/a4.m4a'},
        {name: 'music-keyboard-b4', url: 'sound/arcade/b4.m4a'},
        {name: 'music-keyboard-c5', url: 'sound/arcade/c5.m4a'}
    ],
    [
        {name: 'music-keyboard-c3', url: 'sound/marimba/c3.aac'},
        {name: 'music-keyboard-d3', url: 'sound/marimba/d3.aac'},
        {name: 'music-keyboard-e3', url: 'sound/marimba/e3.aac'},
        {name: 'music-keyboard-f3', url: 'sound/marimba/f3.aac'},
        {name: 'music-keyboard-g3', url: 'sound/marimba/g3.aac'},
        {name: 'music-keyboard-a3', url: 'sound/marimba/a3.aac'},
        {name: 'music-keyboard-b3', url: 'sound/marimba/b3.aac'},
        {name: 'music-keyboard-c4', url: 'sound/marimba/c4.aac'},
        {name: 'music-keyboard-d4', url: 'sound/marimba/d4.aac'},
        {name: 'music-keyboard-e4', url: 'sound/marimba/e4.aac'},
        {name: 'music-keyboard-f4', url: 'sound/marimba/f4.aac'},
        {name: 'music-keyboard-g4', url: 'sound/marimba/g4.aac'},
        {name: 'music-keyboard-a4', url: 'sound/marimba/a4.aac'},
        {name: 'music-keyboard-b4', url: 'sound/marimba/b4.aac'},
        {name: 'music-keyboard-c5', url: 'sound/marimba/c5.aac'}
    ],
    [
        {name: 'music-keyboard-c3', url: 'sound/xylo/c3.aac'},
        {name: 'music-keyboard-d3', url: 'sound/xylo/d3.aac'},
        {name: 'music-keyboard-e3', url: 'sound/xylo/e3.aac'},
        {name: 'music-keyboard-f3', url: 'sound/xylo/f3.aac'},
        {name: 'music-keyboard-g3', url: 'sound/xylo/g3.aac'},
        {name: 'music-keyboard-a3', url: 'sound/xylo/a3.aac'},
        {name: 'music-keyboard-b3', url: 'sound/xylo/b3.aac'},
        {name: 'music-keyboard-c4', url: 'sound/xylo/c4.aac'},
        {name: 'music-keyboard-d4', url: 'sound/xylo/d4.aac'},
        {name: 'music-keyboard-e4', url: 'sound/xylo/e4.aac'},
        {name: 'music-keyboard-f4', url: 'sound/xylo/f4.aac'},
        {name: 'music-keyboard-g4', url: 'sound/xylo/g4.aac'},
        {name: 'music-keyboard-a4', url: 'sound/xylo/a4.aac'},
        {name: 'music-keyboard-b4', url: 'sound/xylo/b4.aac'},
        {name: 'music-keyboard-c5', url: 'sound/xylo/c5.aac'}
    ],
    [
        {name: 'music-keyboard-c3', url: 'sound/cat/c3.aac'},
        {name: 'music-keyboard-d3', url: 'sound/cat/d3.aac'},
        {name: 'music-keyboard-e3', url: 'sound/cat/e3.aac'},
        {name: 'music-keyboard-f3', url: 'sound/cat/f3.aac'},
        {name: 'music-keyboard-g3', url: 'sound/cat/g3.aac'},
        {name: 'music-keyboard-a3', url: 'sound/cat/a3.aac'},
        {name: 'music-keyboard-b3', url: 'sound/cat/b3.aac'},
        {name: 'music-keyboard-c4', url: 'sound/cat/c4.aac'},
        {name: 'music-keyboard-d4', url: 'sound/cat/d4.aac'},
        {name: 'music-keyboard-e4', url: 'sound/cat/e4.aac'},
        {name: 'music-keyboard-f4', url: 'sound/cat/f4.aac'},
        {name: 'music-keyboard-g4', url: 'sound/cat/g4.aac'},
        {name: 'music-keyboard-a4', url: 'sound/cat/a4.aac'},
        {name: 'music-keyboard-b4', url: 'sound/cat/b4.aac'},
        {name: 'music-keyboard-c5', url: 'sound/cat/c5.aac'}
    ]
];



// -----------------------------------------------------------------------------
// TSoftModuleUkulele Class
// WebAudio Layer
// -----------------------------------------------------------------------------

class TSoftModuleUkulele {

    constructor () {

        window.UKULELE_M = this;
        // Initialize WebAudio
        this.sound = Sound.init();
        this.sound.loadSoundFiles(TSoftModuleUkulele.SOUNDS);
        this.previousChord = 'C';
        this.previousKeyInChord = 0;

    }

    // Start, stop an instrument and play a note
    setKey (chord) {
        this.setChord(chord);
    }

    keyDown (chord) {
        var instance = this;
        if (chord) this.setChord(chord);
        this.__triggerTime = new Date().getTime();
        this.strummingTimeoutID = setTimeout(function(){
            instance.strumChord();
        }, TSoftModuleUkulele.STRUMMING_LENGTH);
    }

    keyUp () {
        var t = new Date().getTime() - this.__triggerTime;
        if (t < TSoftModuleUkulele.STRUMMING_LENGTH) {
            clearTimeout(this.strummingTimeoutID);
            this.playChord();
        }
    }

    // @param key (string) Key name such as 'c2', 'f4', 'g5'
    setChord (chord) {
        if (this.previousChord != chord) {
            this.previousChord = chord;
            this.previousKeyInChord = 0;
        }
    }

    // Play a single key
    // @param key (string) Key name such as 'c2', 'f4', 'g5'
    playKey (key) {
        this.sound.playSoundByName('music-ukulele-' + key);
    }

    // Play individual keys within a chord
    // @param key (string) Key name such as 'c2', 'f4', 'g5'
    playChord (chord) {
        if (!chord) {
            chord = this.previousChord;
        } else {
            this.previousChord = chord;
        }
        if (!chord) return;
//        console.log('playChord', chord);
        var c = TSoftModuleUkulele.UKULELE_CHORD_KEYS[chord];
        var key = c[this.previousKeyInChord];
        Sound.playSoundByName('music-ukulele-' + key);
        this.previousKeyInChord ++;
        if (this.previousKeyInChord >= c.length) this.previousKeyInChord = 0;
    }

    // Strum a chord
    // @param key (string) Key name such as 'c2', 'f4', 'g5'
    strumChord (chord) {
        if (!chord) {
            chord = this.previousChord;
        } else {
            this.previousChord = chord;
        }
        if (!chord) return;
       // console.log('strumChord', chord);
        var c = TSoftModuleUkulele.UKULELE_CHORD_KEYS[chord];
        var delay = 0;
        var instance = this;
        this.previousKeyInChord = 0;
        for (var n in c) {
            var key = c[n];
            playDelayed(key, delay);
            delay += TSoftModuleUkulele.STRUM_INTERVAL;
        }

        function playDelayed (key, delay) {
            setTimeout(function(){
                Sound.playSoundByName('music-ukulele-' + key);
            }, delay);
        }
    }

}

TSoftModuleUkulele.STRUMMING_LENGTH = 200; // Keep trigger on for 100ms to strum
TSoftModuleUkulele.STRUM_INTERVAL = 15; // Interval between 2 string strumming
TSoftModuleUkulele.UKULELE_CHORDS = [
    'C', 'Dm', 'Em', 'F', 'G', 'Am', 'B7'
];
TSoftModuleUkulele.UKULELE_CHORD_KEYS = {
    C: ['c3', 'e3', 'g3', 'e3', 'c4', 'g3', 'e3', 'g3'],
    Dm: ['d3', 'f3', 'a3', 'f3', 'd4', 'a3', 'f3', 'a3'],
    Em: ['e3', 'g3', 'b3', 'g3', 'e4', 'b3', 'g3', 'b3'],
    F: ['f3', 'a3', 'c4', 'a3', 'f4', 'c4', 'a3', 'c4'],
    G: ['g2', 'b2', 'd3', 'b2', 'g3', 'd3', 'b2', 'd3'],
    Am: ['a2', 'c3', 'e3', 'c3', 'a3', 'e3', 'c3', 'e3'],
    B7: ['b2', 'd3s', 'a3', 'd3s', 'b3', 'a3', 'd3s', 'a3']
};
TSoftModuleUkulele.SOUNDS = [
    {name: 'music-ukulele-c2', url: 'sound/ukulele/c2.aac'},
    {name: 'music-ukulele-d2', url: 'sound/ukulele/d2.aac'},
    {name: 'music-ukulele-e2', url: 'sound/ukulele/e2.aac'},
    {name: 'music-ukulele-f2', url: 'sound/ukulele/f2.aac'},
    {name: 'music-ukulele-g2', url: 'sound/ukulele/g2.aac'},
    {name: 'music-ukulele-a2', url: 'sound/ukulele/a2.aac'},
    {name: 'music-ukulele-b2', url: 'sound/ukulele/b2.aac'},
    {name: 'music-ukulele-c3', url: 'sound/ukulele/c3.aac'},
    {name: 'music-ukulele-d3', url: 'sound/ukulele/d3.aac'},
    {name: 'music-ukulele-d3s', url: 'sound/ukulele/d3s.aac'},
    {name: 'music-ukulele-e3', url: 'sound/ukulele/e3.aac'},
    {name: 'music-ukulele-f3', url: 'sound/ukulele/f3.aac'},
    {name: 'music-ukulele-g3', url: 'sound/ukulele/g3.aac'},
    {name: 'music-ukulele-a3', url: 'sound/ukulele/a3.aac'},
    {name: 'music-ukulele-b3', url: 'sound/ukulele/b3.aac'},
    {name: 'music-ukulele-c4', url: 'sound/ukulele/c4.aac'},
    {name: 'music-ukulele-d4', url: 'sound/ukulele/d4.aac'},
    {name: 'music-ukulele-d4s', url: 'sound/ukulele/d4s.aac'},
    {name: 'music-ukulele-e4', url: 'sound/ukulele/e4.aac'},
    {name: 'music-ukulele-f4', url: 'sound/ukulele/f4.aac'},
    {name: 'music-ukulele-g4', url: 'sound/ukulele/g4.aac'},
    {name: 'music-ukulele-a4', url: 'sound/ukulele/a4.aac'},
    {name: 'music-ukulele-b4', url: 'sound/ukulele/b4.aac'},
    {name: 'music-ukulele-c5', url: 'sound/ukulele/c5.aac'}
];



// -----------------------------------------------------------------------------
// TSoftModuleStringInstrument Class V0.7
// Web Audio Layer
// -----------------------------------------------------------------------------

class TSoftModuleStringInstrument {

    constructor () {

        window.VIOLIN_M = this;

        // Initialize WebAudio
        this.mod = Sound.context.createOscillator();
        this.mod.type = 'sine';
        this.mod.frequency.value = 6;
        this.mod.start(0);

        this.modGain = Sound.context.createGain ? Sound.context.createGain() : Sound.context.createGainNode();
        this.modGain.gain.value = 25;

        this.osc = Sound.context.createOscillator();
        this.osc.type = 'sawtooth';
        this.osc.frequency.value = 440;
        this.osc.start(0);

        this.oscBandPassFilter = Sound.context.createBiquadFilter();
        this.oscBandPassFilter.type = 'bandpass';
        this.oscBandPassFilter.Q.value = 1;
        this.oscBandPassFilter.frequency.value = 10;

        this.oscLowPassFilter = Sound.context.createBiquadFilter();
        this.oscLowPassFilter.type = 'lowpass';
        this.oscLowPassFilter.Q.value = 1;
        this.oscLowPassFilter.frequency.value = 1000;

        this.oscGain = Sound.context.createGain ? Sound.context.createGain() : Sound.context.createGainNode();
        this.oscGain.gain.value = 0;

        this.previousFrequency = 0;
        this.previousGain = 0;

        // Connect nodes
        this.mod.connect(this.modGain);
        this.modGain.connect(this.osc.detune);
        this.osc.connect(this.oscBandPassFilter);
        this.oscBandPassFilter.connect(this.oscLowPassFilter);
        this.oscLowPassFilter.connect(this.oscGain);
        this.oscGain.connect(Sound.context.destination);

    }

    // Turn on the sound
    // @param key (string / int) Key name 'C4#' or frequency (440)
    keyDown (key) {
        this.__triggerStatus = true;
        this.play(key);
    }

    // Turn off the sound
    keyUp () {
        clearInterval(this.afterTouchIntervalID);
        this.oscGain.gain.value = 0;
        this.previousGain = 0;
//        delete this.previousKey;
        this.__triggerStatus = false;
    }

    // Set the pitch of current key
    setKey (key) {
        this.play(key);
    }

    // @param key (string / int) Key name 'C4#' or frequency (440)
    play (key, gain, modulation) {
        var instance = this;
        var frequency;
        if (!key) {
            key = this.previousKey;
        } else {
            this.previousKey = key;
        }
        if (!key) return;
        var freq = TSoftModuleStringInstrument.keyToFrequency(key);
        if (!freq) freq = 0;
        if (isNaN(gain)) gain = this.__triggerStatus? TSoftModuleStringInstrument.VOLUME * freq / 110 / 10 : 0;
        if (isNaN(modulation)) modulation = TSoftModuleStringInstrument.MODULATION;
//        console.log('TSoftModuleStringInstrument.play '+ key + ' ' + gain);
        if (typeof key == 'string') {
            frequency = TSoftModuleStringInstrument.keyToFrequency(key);
        } else {
            frequency = key;
        }
        if (typeof frequency == 'undefined') {
            frequency = this.previousFrequency;
        } else {
            this.previousFrequency = frequency;
        }
        if (this.previousKey != key || this.previousGain != gain) {
            this.previousKey = key;
            this.modulationPhase = Math.PI;
            this.osc.frequency.value = frequency;
            this.oscGain.gain.value = gain;
            clearInterval(this.afterTouchIntervalID);
    //        if (typeof modulation == 'number') {
    //            this.modGain.gain.value = modulation;
    //        } else {
                this.afterTouchIntervalID = setInterval(onAfterTouch, 200);
    //        }

        }

        if (typeof gain == 'undefined') {
            gain = this.previousGain;
        } else {
            this.previousGain = gain;
        }

        function onAfterTouch () {
            var amp = Math.cos(instance.modulationPhase) + 1;
            instance.modulationPhase += .4;
            instance.modGain.gain.value = 30 * amp;
            if (gain) instance.oscGain.gain.value = gain + 80 * amp;
        }

    }

    remove () {
        clearInterval(this.afterTouchIntervalID);
        try {
            this.oscGain.disconnect(Sound.context.destination);
        } catch (error) {}
    }

}

// Convert key name (c4#) to frequency (440Hz)
// @param keyName (string)
TSoftModuleStringInstrument.keyToFrequency = function (keyName) {

    var octave = 4;
    var key = 0;
    var modifier = 0;

    for (var n=0; n<keyName.length; n++) {
        var c = keyName.charAt(n).toLowerCase();
        var oct = parseInt(c);
        if (oct > 1 && oct < 7) {
            // In case of a valid octave index
            octave = oct;
        } else {
            // In case a key name or modifier
            switch (c) {
                case 'c':
                    key = 0;
                    break;
                case 'd':
                    key = 2;
                    break;
                case 'e':
                    key = 4;
                    break;
                case 'f':
                    key = 5;
                    break;
                case 'g':
                    key = 7;
                    break;
                case 'a':
                    key = 9;
                    break;
                case 'b':
                    key = 11;
                    break;
                case '#':
                    modifier = 1;
                    break;
            }
        }
    }

    var globalKeyIndex = octave * 12 + key + modifier;
    return TSoftModuleStringInstrument.BASE_FREQUENCY * Math.pow(TSoftModuleStringInstrument.KEY_MULTIPLICATION, globalKeyIndex - 57); // C4 = 261.6Hz A4 = 440Hz

}

TSoftModuleStringInstrument.BASE_FREQUENCY = 880;
TSoftModuleStringInstrument.KEY_MULTIPLICATION = Math.pow(2, 1/12); // Each key's frequency is 2^1/12 time to the previous one
TSoftModuleStringInstrument.VIOLIN = 0;
TSoftModuleStringInstrument.XYLOPHONE = 1;
TSoftModuleStringInstrument.SINGULARITY_MIN = -.02;
TSoftModuleStringInstrument.SINGULARITY_MAX = -.002;
TSoftModuleStringInstrument.SINGULARITY_CHECK_INTERVAL = 25;
TSoftModuleStringInstrument.STRING_HEIGHT = 77;
TSoftModuleStringInstrument.FRET_RANGE = 44;
TSoftModuleStringInstrument.VOLUME = 180; // Violin baseline volume
TSoftModuleStringInstrument.MODULATION = 30;
TSoftModuleStringInstrument.MIN_DISTANCE = 5; // Stop sound if distance < 3cm
TSoftModuleStringInstrument.MAX_DISTANCE = 35; // Stop sound if distance > 39cm
