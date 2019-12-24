/**
* EventDispatcher Classes
* http://tinkamo.com
*
* Copyright 2017 Tinkamo
* Rev 2017-11-29 By Lion
**/

class EventDispatcher {

    constructor() {
        this._listeners = [];
    }

    hasEventListener(type, listener) {
        return this._listeners.some(item => item.type === type && item.listener === listener);
    }

    addEventListener(type, listener) {
        if (!this.hasEventListener(type, listener)) {
            this._listeners.push({type, listener, options: {once: false}});
        }
        // console.log(`${this}-listeners:`,this._listeners);
        return this
    }

    removeEventListener(type, listener) {
        let index = this._listeners.findIndex(item => item.type === type && item.listener === listener);
        if (index >= 0) this._listeners.splice(index, 1);
//        console.log(`${this}-listeners:`, this._listeners);
        return this;
    }

    removeEventListeners() {
        this._listeners = [];
        return this;
    }

    dispatchEvent(evt) {
        this._listeners
            .filter(item => item.type === evt.type)
            .forEach(item => {
                const {type, listener, options: {once}} = item;
                listener.call(this, evt);
                if (once === true) this.removeEventListener(type, listener)
            });
        // console.log(`${this}-listeners:`,this._listeners);
        return this
    }

    on(type, listener) {
        return this.addEventListener(type, listener)
    }

    when(type, listener) {
        return this.addEventListener(type, listener)
    }

    off(type, listener) {
        return this.removeEventListener(type, listener)
    }

    cancelWhen(type,listener){
        return this.removeEventListener(type,listener)
    }

    happen(evt){
        return this.dispatchEvent(evt)
    }

}
