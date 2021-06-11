import SplittingText from './splittingText'

export default class {
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

        this.changeText(this.options.text)
    }

    changeText (text) {
        this.text = new SplittingText(this.ctx, text, {
            position: this.options.position,
        })
    }

    update (mx, my) {
        const { position, color } = this.options

        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.arc(position.x, position.y, 15, 0, Math.PI * 2)
        this.ctx.fill()

        this.text.update()

        if (this.socket.id === this.ID) {
            this.options.position.set(mx, my)
            this.socket.emit('update-position', { x: mx, y: my })
        }
    }
}
