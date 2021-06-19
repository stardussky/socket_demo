import * as THREE from 'three'

export default class {
    constructor (camera, body, domElement, options) {
        if (domElement === undefined) {
            domElement = document.body
        }

        this.domElement = domElement
        this.camera = camera
        this.body = body
        this.options = {
            jumpVelocity: 30,
            velocityFactor: 40,
            personHeight: 10,
            ...options,
        }

        this.isLocked = false

        this.minPolarAngle = 0
        this.maxPolarAngle = Math.PI

        this.euler = new THREE.Euler(0, 0, 0, 'YXZ')
        this.vector = new THREE.Vector3()
        this.movement = new THREE.Vector2()
        this.lerpMovement = new THREE.Vector2()

        this.onEvents = {}
    }

    lock () {
        this.isLocked = true
    }

    unlock () {
        this.isLocked = false
        this.movement.set(0, 0)
    }

    update () {
        this.lerpMovement.lerp(this.movement, 0.1)

        this.euler.y -= this.lerpMovement.x
        this.euler.x -= this.lerpMovement.y

        this.euler.x = Math.max(
            Math.PI / 2 - this.maxPolarAngle,
            Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x)
        )

        this.camera.quaternion.setFromEuler(this.euler)
    }

    on (name, callback) {
        if (typeof name === 'string' && typeof callback === 'function') {
            this.onEvents[name] = callback
        }
    }

    getObject () {
        return this.camera
    }
}
