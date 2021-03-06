import { Vector2 } from 'three'
import Base from './base'

class BufferCanvas extends Base {
    constructor (el, socket, sockets) {
        super(el, {
            clear: false,
            autoRender: false,
        })
        if (el instanceof Element) {
            this.socket = socket
            this.sockets = sockets
            this.history = []
        }
    }

    socketEvents () {
        this.sockets.subscribe('get-sketch-history', async (history) => {
            this.onEvents.loadHistory?.()
            Promise.all(history.map(({ value }) => this.drawHistory(value))).then(result => {
                this.history = result
                this.onEvents.loadedHistory?.()
            })
        })
        this.sockets.subscribe('updated-sketch', (payload) => {
            this.draw(payload)
        })
        this.sockets.subscribe('delete-sketch-history', (history) => {
            Promise.all(history.map(({ value }) => this.baseToImage(value))).then(result => {
                this.history = result
                this.refreshSketch()
            })
        })
    }

    unSubSocketEvents () {
        this.sockets.unsubscribe('get-sketch-history')
        this.sockets.unsubscribe('updated-sketch')
        this.sockets.unsubscribe('delete-sketch-history')
    }

    baseToImage (base) {
        return new Promise(resolve => {
            const image = new Image()
            image.onload = () => {
                resolve(image)
            }
            image.src = base
        })
    }

    async drawHistory (payload) {
        const { halfWight, halfHeight, dpr } = this.viewport
        let image

        if (payload instanceof Image) {
            image = payload
        } else {
            image = await this.baseToImage(payload)
            this.history.push(image)
        }

        this.ctx.save()
        this.ctx.translate(halfWight * dpr - image.width / 2, halfHeight * dpr - image.height / 2)

        this.ctx.drawImage(image, 0, 0)

        this.ctx.restore()

        return image
    }

    draw ({ color, sx, sy, mx, my }) {
        const { halfWight, halfHeight, dpr } = this.viewport

        this.ctx.save()
        this.ctx.translate(halfWight * dpr, halfHeight * dpr)
        this.ctx.scale(dpr, dpr)

        this.ctx.beginPath()
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = 2
        this.ctx.moveTo(sx, sy)
        this.ctx.lineTo(mx, my)
        this.ctx.stroke()

        this.ctx.restore()
    }

    refreshSketch () {
        const { width, height, dpr } = this.viewport

        this.ctx.clearRect(0, 0, width * dpr, height * dpr)

        for (let i = 0; i < this.history.length; i++) {
            this.drawHistory(this.history[i])
        }
    }

    resize () {
        super.resize()
        this.refreshSketch()
    }

    start () {
        this.socketEvents()
    }

    stop () {
        this.unSubSocketEvents()
    }

    destroy () {
        this.stop()

        super.destroy()
    }
}

export default class extends Base {
    constructor (el, socket, sockets) {
        super(el, {
            clear: false,
            autoRender: false,
        })
        if (el instanceof Element) {
            this.ID = null
            this.bufferCanvas = new BufferCanvas(this.el, socket, sockets)
            this.socket = socket
            this.sockets = sockets
            this.isDrawing = false
            this.strokeColor = null
            this.mouse = new Vector2()
            this.startingPosition = new Vector2()
            this.mousemove = this.mousemove.bind(this)
            this.mouseup = this.mouseup.bind(this)
            this.mousedown = this.mousedown.bind(this)

            this.bufferCanvas.on('loadHistory', () => {
                this.onEvents.loadHistory?.()
            })
            this.bufferCanvas.on('loadedHistory', () => {
                this.onEvents.loadedHistory?.()
            })

            this.reqRenders.push(() => {
                this.draw()
            })
        }
    }

    socketEvents () {
        this.sockets.subscribe('get-user', (user) => {
            const { ID, color } = user
            this.ID = ID
            this.strokeColor = color
        })
        this.sockets.subscribe('updated-color', (user) => {
            const { ID, color } = user
            if (ID === this.ID) {
                this.strokeColor = color
            }
        })
    }

    unSubSocketEvents () {
        this.sockets.unsubscribe('get-user')
        this.sockets.unsubscribe('updated-color')
    }

    draw () {
        if (this.isDrawing) {
            const { x: mx, y: my } = this.mouse
            const { x: sx, y: sy } = this.startingPosition
            this.ctx.beginPath()
            this.ctx.strokeStyle = this.strokeColor
            this.ctx.lineWidth = 2
            this.ctx.moveTo(sx, sy)
            this.ctx.lineTo(mx, my)
            this.ctx.stroke()
            this.socket.emit('update-sketch', {
                color: this.strokeColor,
                sx,
                sy,
                mx,
                my,
            })
            this.startingPosition.set(mx, my)
        }
    }

    mousemove ({ clientX, clientY }) {
        const { halfWight, halfHeight } = this.viewport
        const x = clientX - halfWight
        const y = clientY - halfHeight
        this.mouse.set(x, y)
    }

    async mouseup () {
        const { width, height, dpr } = this.viewport

        this.isDrawing = false
        const base = this.canvas.toDataURL()
        this.socket.emit('add-sketch-history', base)
        await this.bufferCanvas.drawHistory(base)
        this.ctx.clearRect(0, 0, width * dpr, height * dpr)
    }

    mousedown () {
        this.isDrawing = true
        this.startingPosition = this.mouse.clone()
    }

    start () {
        this.render()
        this.bufferCanvas.start()

        this.el.addEventListener('mousemove', this.mousemove)
        this.el.addEventListener('mouseup', this.mouseup)
        this.el.addEventListener('mousedown', this.mousedown)
        this.el.addEventListener('mouseleave', this.mouseup)

        this.socketEvents()
    }

    stop () {
        super.stop()
        this.bufferCanvas.stop()

        this.el.removeEventListener('mousemove', this.mousemove)
        this.el.removeEventListener('mouseup', this.mouseup)
        this.el.removeEventListener('mousedown', this.mousedown)
        this.el.removeEventListener('mouseleave', this.mouseup)

        this.unSubSocketEvents()
    }

    destroy () {
        this.stop()
        this.bufferCanvas.destroy()

        super.destroy()
    }
}
