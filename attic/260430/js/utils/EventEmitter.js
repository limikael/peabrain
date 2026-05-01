export default class EventEmitter {
    constructor() {
        this._e = {};
    }

    on(type, fn) {
        if (!this._e[type]) {
            this._e[type] = [];
        }
        this._e[type].push(fn);
    }

    off(type, fn) {
        const list = this._e[type];
        if (!list) return;

        const i = list.indexOf(fn);
        if (i !== -1) {
            list.splice(i, 1);
        }

        // Optional cleanup
        if (list.length === 0) {
            delete this._e[type];
        }
    }

    emit(type, arg) {
        const list = this._e[type];
        if (!list) return;

        for (let i = 0; i < list.length; i++) {
            list[i](arg);
        }

        // copy in case listeners mutate the array
        /*for (const fn of [...list]) {
            fn(arg);
        }*/
    }
}