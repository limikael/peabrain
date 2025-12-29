export default class EventEmitter {
    constructor() {
        this._e = {}
    }

    on(t, f) {
        (this._e[t] || (this._e[t] = [])).push(f)
    }

    emit(t, a) {
        const e = this._e[t]
        if (!e) return
        for (let i = 0; i < e.length; i++)
            e[i](a)
    }
}
