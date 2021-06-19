import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Base from './base'

export default class extends Base {
    constructor (camera, body, domElement, options) {
        super(camera, body, domElement, options)

        this.onTouchStart = this.onTouchStart.bind(this)
        this.onTouchMove = this.onTouchMove.bind(this)
        this.onTouchEnd = this.onTouchEnd.bind(this)
        this.tapTouchButton = this.tapTouchButton.bind(this)
        this.moveTouchButton = this.moveTouchButton.bind(this)
        this.endTouchButton = this.endTouchButton.bind(this)

        this.isMove = false
        this.previousTouch = null

        if (this.body) {
            this.velocity = this.body.velocity
            this.direction = new THREE.Vector3()
            this.inputVelocity = new THREE.Vector3()

            const contactNormal = new CANNON.Vec3()
            this.body.addEventListener('collide', (e) => {
                const { contact } = e

                if (contact.bi.id === this.body.id) {
                    contact.ni.negate(contactNormal)
                } else {
                    contactNormal.copy(contact.ni)
                }
            })
        }
    }

    setup () {
        this.createControlsElement()
        this.domElement.ownerDocument.addEventListener('touchstart', this.onTouchStart)
        this.domElement.ownerDocument.addEventListener('touchmove', this.onTouchMove)
        this.domElement.ownerDocument.addEventListener('touchend', this.onTouchEnd)
    }

    destroy () {
        this.controlsButton.removeEventListener('touchstart', this.tapTouchButton)
        this.controlsButton.removeEventListener('touchend', this.endTouchButton)
        this.controlsEl.removeEventListener('touchmove', this.moveTouchButton)

        this.domElement.ownerDocument.removeEventListener('touchstart', this.onTouchStart)
        this.domElement.ownerDocument.removeEventListener('touchmove', this.onTouchMove)
        this.domElement.ownerDocument.removeEventListener('touchend', this.onTouchEnd)

        this.domElement.removeChild(this.controlsEl)
    }

    createControlsElement () {
        this.controlsEl = document.createElement('div')
        this.controlsEl.className = 'touch-controls'

        this.controlsButton = document.createElement('div')
        this.controlsButton.className = 'touch-controls__btn'

        this.controlsButton.addEventListener('touchstart', this.tapTouchButton)
        this.controlsButton.addEventListener('touchend', this.endTouchButton)
        this.controlsEl.addEventListener('touchmove', this.moveTouchButton)

        this.controlsEl.appendChild(this.controlsButton)
        this.domElement.appendChild(this.controlsEl)
    }

    onTouchStart () {
        this.lock()
    }

    onTouchMove (e) {
        if (this.isLocked) {
            const touch = [...e.touches].find(({ target }) => target === e.target)
            const { clientX: x, clientY: y } = touch

            if (this.previousTouch) {
                const { clientX: px, clientY: py } = this.previousTouch
                this.euler.setFromQuaternion(this.camera.quaternion)

                const movementX = x - px
                const movementY = y - py
                this.movement.set(movementX * 0.002, movementY * 0.002)
            }

            this.previousTouch = touch
        }
    }

    onTouchEnd () {
        this.unlock()
        this.previousTouch = null
    }

    tapTouchButton () {
        this.isMove = true
    }

    moveTouchButton (e) {
        if (this.isMove) {
            e.preventDefault()
            e.stopPropagation()
            const { clamp } = THREE.MathUtils
            const { currentTarget, touches } = e
            const { clientX, clientY } = [...touches].find(({ target }) => target === e.target)
            const { top, left, width, height } = currentTarget.getBoundingClientRect()
            const boundingRangeX = width / 2
            const boundingRangeY = height / 2

            const offsetX = clientX - (left + boundingRangeX)
            const offsetY = clientY - (top + boundingRangeY)

            this.direction.set(offsetX, 0, offsetY).normalize()

            const angle = Math.atan2(offsetX, offsetY)
            const progressX = clamp(offsetX, -boundingRangeX, boundingRangeX) / boundingRangeX * Math.sign(offsetX)
            const progressY = clamp(offsetY, -boundingRangeY, boundingRangeY) / boundingRangeY * Math.sign(offsetY)
            const rX = (boundingRangeX - this.controlsButton.clientWidth / 2)
            const rY = (boundingRangeY - this.controlsButton.clientHeight / 2)
            this.controlsButton.style.transform = `
                translate(-50%, -50%)
                translate(
                    ${Math.sin(angle) * rX * progressX}px,
                    ${Math.cos(angle) * rY * progressY}px
                )
            `
        }
    }

    endTouchButton () {
        this.isMove = false
        this.direction.set(0, 0, 0)
        this.controlsButton.style.transform = 'translate(-50%, -50%) translate(0px, 0px)'
    }

    update (delta) {
        super.update()

        if (this.body) {
            this.inputVelocity.set(0, 0, 0)
            const { velocityFactor, personHeight } = this.options

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
