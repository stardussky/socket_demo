import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Base from './base'

export default class extends Base {
    constructor (camera, body, domElement, options) {
        super(camera, body, domElement, options)

        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
        this.onKeyDown = this.onKeyDown.bind(this)
        this.onKeyUp = this.onKeyUp.bind(this)

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
    }

    setup () {
        this.domElement.ownerDocument.addEventListener('mousedown', this.onMouseDown)
        this.domElement.ownerDocument.addEventListener('mousemove', this.onMouseMove)
        this.domElement.ownerDocument.addEventListener('mouseup', this.onMouseUp)
        this.domElement.ownerDocument.addEventListener('mouseleave', this.onMouseUp)
        this.domElement.ownerDocument.addEventListener('keydown', this.onKeyDown)
        this.domElement.ownerDocument.addEventListener('keyup', this.onKeyUp)
    }

    destroy () {
        this.domElement.ownerDocument.removeEventListener('mousedown', this.onMouseDown)
        this.domElement.ownerDocument.removeEventListener('mousemove', this.onMouseMove)
        this.domElement.ownerDocument.removeEventListener('mouseup', this.onMouseUp)
        this.domElement.ownerDocument.removeEventListener('mouseleave', this.onMouseUp)
        this.domElement.ownerDocument.removeEventListener('keydown', this.onKeyDown)
        this.domElement.ownerDocument.removeEventListener('keyup', this.onKeyUp)
    }

    onMouseDown () {
        this.lock()
    }

    onMouseMove ({ movementX, movementY }) {
        if (this.isLocked) {
            this.euler.setFromQuaternion(this.camera.quaternion)

            this.movement.set(movementX * 0.002, movementY * 0.002)
        }
    }

    onMouseUp () {
        this.unlock()
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

    update (delta) {
        super.update()

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
}
