import MouseControls from './mouseControls'
import TouchControls from './touchControls'

const CONTROLS_TYPE = Object.freeze({
    mouse: 'mouseControls',
    touch: 'touchControls',
})

export default class {
    constructor (type, camera, body, domElement, options) {
        this.currentControls = null
        this.mouseControls = new MouseControls(camera, body, domElement, options)
        this.touchControls = new TouchControls(camera, body, domElement, options)

        this.setControl(type)
    }

    getObject () {
        return this[this.currentControls].getObject()
    }

    lock () {
        this[this.currentControls].lock()
    }

    unlock () {
        this[this.currentControls].unlock()
    }

    update (delta) {
        this[this.currentControls].update(delta)
    }

    on (name, callback) {
        this[this.currentControls].on(name, callback)
    }

    setControl (type) {
        if (CONTROLS_TYPE[type]) {
            if (this[this.currentControls]) {
                this[this.currentControls].destroy()
            }

            this.currentControls = CONTROLS_TYPE[type]
            this[this.currentControls].setup()
        }
    }
}
