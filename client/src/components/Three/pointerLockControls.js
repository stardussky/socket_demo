import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export default class extends THREE.EventDispatcher {
    constructor (camera, body, domElement, options) {
        super()

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

        this.changeEvent = { type: 'change' }
        this.lockEvent = { type: 'lock' }
        this.unlockEvent = { type: 'unlock' }

        this.onMouseMove = this.onMouseMove.bind(this)
        this.onPointerlockChange = this.onPointerlockChange.bind(this)
        this.onPointerlockError = this.onPointerlockError.bind(this)
        this.onKeyDown = this.onKeyDown.bind(this)
        this.onKeyUp = this.onKeyUp.bind(this)
        this.onEvents = {}

        this.moveForward = false
        this.moveBackward = false
        this.moveLeft = false
        this.moveRight = false
        this.canJump = false

        if (this.body) {
            this.velocity = this.body.velocity
            this.direction = new THREE.Vector3()
            this.inputVelocity = new THREE.Vector3()

            const contactNormal = new CANNON.Vec3()
            const upAxis = new CANNON.Vec3(0, 1, 0)
            this.body.addEventListener('collide', (e) => {
                const { contact } = e

                if (contact.bi.id === this.body.id) {
                    contact.ni.negate(contactNormal)
                } else {
                    contactNormal.copy(contact.ni)
                }

                if (contactNormal.dot(upAxis) > 0.5) {
                    this.canJump = true
                }
            })
        }

        this.connect()
    }

    onMouseMove ({ movementX, movementY }) {
        if (this.isLocked) {
            this.euler.setFromQuaternion(this.camera.quaternion)

            this.euler.y -= movementX * 0.002
            this.euler.x -= movementY * 0.002

            this.euler.x = Math.max(
                Math.PI / 2 - this.maxPolarAngle,
                Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x)
            )

            this.camera.quaternion.setFromEuler(this.euler)

            this.dispatchEvent(this.changeEvent)
        }
    }

    onPointerlockChange () {
        if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
            this.dispatchEvent(this.lockEvent)
            this.isLocked = true
        } else {
            this.dispatchEvent(this.unlockEvent)
            this.isLocked = false
        }
    }

    onPointerlockError () {
        // console.error('THREE.PointerLockControls: Unable to use Pointer Lock API')
    }

    onKeyDown ({ code }) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true
                this.onEvents.moveForward?.(this.moveForward, this)
                break

            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true
                this.onEvents.moveLeft?.(this.moveLeft, this)
                break

            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true
                this.onEvents.moveBackward?.(this.moveBackward, this)
                break

            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true
                this.onEvents.moveRight?.(this.moveRight, this)
                break

            case 'Space':
                if (this.canJump && this.body) {
                    setTimeout(() => {
                        this.velocity.y = this.options.jumpVelocity
                    }, 200)
                }
                this.onEvents.jump?.(this)
                this.canJump = false
                break
        }
    }

    onKeyUp ({ code }) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false
                this.onEvents.moveForward?.(this.moveForward, this)
                break

            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false
                this.onEvents.moveLeft?.(this.moveLeft, this)
                break

            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false
                this.onEvents.moveBackward?.(this.moveBackward, this)
                break

            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false
                this.onEvents.moveRight?.(this.moveRight, this)
                break
        }
    }

    connect () {
        this.domElement.ownerDocument.addEventListener('mousemove', this.onMouseMove)
        this.domElement.ownerDocument.addEventListener('pointerlockchange', this.onPointerlockChange)
        this.domElement.ownerDocument.addEventListener('pointerlockerror', this.onPointerlockError)
        this.domElement.ownerDocument.addEventListener('keydown', this.onKeyDown)
        this.domElement.ownerDocument.addEventListener('keyup', this.onKeyUp)
    }

    disconnect () {
        this.domElement.ownerDocument.removeEventListener('mousemove', this.onMouseMove)
        this.domElement.ownerDocument.removeEventListener('pointerlockchange', this.onPointerlockChange)
        this.domElement.ownerDocument.removeEventListener('pointerlockerror', this.onPointerlockError)
        this.domElement.ownerDocument.removeEventListener('keydown', this.onKeyDown)
        this.domElement.ownerDocument.removeEventListener('keyup', this.onKeyUp)
    }

    dispose () {
        this.disconnect()
    }

    getObject () {
        return this.camera
    }

    getDirection = (() => {
        const direction = new THREE.Vector3(0, 0, -1)

        return function (v) {
            return v.copy(direction).applyQuaternion(this.camera.quaternion)
        }
    })()

    lock () {
        this.domElement.requestPointerLock()
    }

    unlock () {
        this.domElement.ownerDocument.exitPointerLock()
    }

    update (delta) {
        if (this.body) {
            this.inputVelocity.set(0, 0, 0)
            const { velocityFactor, personHeight } = this.options

            this.direction.set(
                !!this.moveRight - !!this.moveLeft,
                0,
                !!this.moveBackward - !!this.moveForward
            )
            this.direction.normalize()

            this.inputVelocity
                .add(this.direction)
                .multiplyScalar(velocityFactor * delta)
                .applyQuaternion(this.camera.quaternion)

            this.velocity.x += this.inputVelocity.x
            this.velocity.z += this.inputVelocity.z

            this.camera.position.copy(this.body.position)
            this.camera.position.y += personHeight
        }
    }

    on (name, callback) {
        if (typeof name === 'string' && typeof callback === 'function') {
            this.onEvents[name] = callback
        }
    }
}
