import { Vector2 } from 'three'

class SplittingText {
    constructor (ctx, text, options) {
        this.ctx = ctx
        this.text = text
        this.options = {
            ...options,
        }
        this.lerpPosition = this.options.position.clone()
    }

    update (position, spacing) {
        const { font, fontSize } = this.options
        this.lerpPosition.lerp(position, 0.2)

        this.ctx.font = `${fontSize}px ${font}`
        this.ctx.fillText(this.text, this.lerpPosition.x + spacing, this.lerpPosition.y + 25)

        return this.lerpPosition
    }
}

class Cursor {
    constructor (ctx, socket, ID, options) {
        this.ctx = ctx
        this.socket = socket
        this.ID = ID
        this.options = {
            font: 'Arial',
            fontSize: 12,
            letterSpacing: 10,
            ...options,
        }

        this.splitText(this.options.text)
    }

    splitText (text) {
        this.text = []

        const { font, fontSize, position } = this.options
        const letterPosition = position
        for (let i = 0; i < text.length; i++) {
            const letter = text[i]
            this.text.push(new SplittingText(this.ctx, letter, {
                font,
                fontSize,
                position: letterPosition,
            }))
        }

        this.options.text = text
    }

    update (mx, my) {
        const { position, color, letterSpacing } = this.options
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.arc(position.x, position.y, 15, 0, Math.PI * 2)

        let letterPosition = position
        for (let i = 0; i < this.text.length; i++) {
            const text = this.text[i]
            letterPosition = text.update(letterPosition, letterSpacing * (i + 1))
        }

        this.ctx.fill()

        if (this.socket.id === this.ID) {
            this.options.position.set(mx, my)
            this.socket.emit('update-position', { x: mx, y: my })
        }
    }
}

export default class {
    constructor (el, socket, sockets) {
        if (el instanceof Element) {
            this.el = el
            this.socket = socket
            this.sockets = sockets
            this.cursors = {}
            this.reqRenders = []
            this.mouse = new Vector2()
            this.render = this.render.bind(this)
            this.resize = this.resize.bind(this)
            this.mousemove = this.mousemove.bind(this)

            const { width, height, dpr } = this.viewport
            this.canvas = document.createElement('canvas')
            this.canvas.width = width * dpr
            this.canvas.height = height * dpr
            this.ctx = this.canvas.getContext('2d')
            this.el.appendChild(this.canvas)

            this.reqRenders.push(() => {
                this.draw()
            })

            this.render()
            window.addEventListener('mousemove', this.mousemove)
            window.addEventListener('resize', this.resize)

            this.socketEvents()
        }
    }

    socketEvents () {
        this.sockets.subscribe('get-users', (users) => {
            for (const ID in users) {
                this.addCursor(ID, users[ID])
            }
        })
        this.sockets.subscribe('user-connected', ([ID, user]) => {
            this.addCursor(ID, user)
        })
        this.sockets.subscribe('user-disconnected', (ID) => {
            this.deleteCursor(ID)
        })
        this.sockets.subscribe('updated-position', ([ID, user]) => {
            this.updateCursorPosition(ID, user)
        })
        this.sockets.subscribe('updated-color', ([ID, user]) => {
            this.updateCursorColor(ID, user)
        })
        this.sockets.subscribe('updated-name', ([ID, user]) => {
            this.updateCursorName(ID, user)
        })
    }

    addCursor (ID, user) {
        const { x, y, color, name } = user
        this.cursors[ID] = new Cursor(this.ctx, this.socket, ID, {
            position: new Vector2(x, y),
            color,
            text: name,
        })
    }

    deleteCursor (ID) {
        delete this.cursors[ID]
    }

    updateCursorPosition (ID, user) {
        const { x, y } = user
        this.cursors[ID].options.position.set(x, y)
    }

    updateCursorColor (ID, user) {
        const { color } = user
        this.cursors[ID].options.color = color
    }

    updateCursorName (ID, user) {
        const { name } = user
        this.cursors[ID].splitText(name)
    }

    changeColor (color) {
        this.socket.emit('update-color', color)
    }

    changeName (name) {
        this.socket.emit('update-name', name)
    }

    draw () {
        const { x, y } = this.mouse

        for (const ID in this.cursors) {
            const cursor = this.cursors[ID]
            cursor.update(x, y)
        }
    }

    render () {
        this.reqID = window.requestAnimationFrame(this.render)

        const { width, halfWight, height, halfHeight, dpr } = this.viewport

        this.ctx.clearRect(0, 0, width * dpr, height * dpr)
        this.ctx.save()
        this.ctx.translate(halfWight * dpr, halfHeight * dpr)
        this.ctx.scale(dpr, dpr)
        for (let i = 0; i < this.reqRenders.length; i++) {
            this.reqRenders[i](this.reqID)
        }
        this.ctx.restore()
    }

    mousemove ({ clientX, clientY }) {
        const { halfWight, halfHeight } = this.viewport
        const x = clientX - halfWight
        const y = clientY - halfHeight
        this.mouse.set(x, y)
    }

    resize () {
        const { width, height, dpr } = this.viewport
        this.canvas.width = width * dpr
        this.canvas.height = height * dpr
    }

    destroy () {
        window.cancelAnimationFrame(this.reqID)
        window.removeEventListener('mousemove', this.mousemove)
        window.removeEventListener('resize', this.resize)
        this.el.removeChild(this.canvas)

        this.sockets.unsubscribe('get-users')
        this.sockets.unsubscribe('user-connected')
        this.sockets.unsubscribe('user-disconnected')
        this.sockets.unsubscribe('updated-position')
        this.sockets.unsubscribe('updated-color')
        this.sockets.unsubscribe('updated-name')
    }

    get viewport () {
        const dpr = Math.min(window.devicePixelRatio, 1.5)
        const { width, height } = this.el.getBoundingClientRect()
        return {
            width,
            height,
            halfWight: width / 2,
            halfHeight: height / 2,
            dpr,
        }
    }
}
