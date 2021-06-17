import { Vector2 } from 'three'
import Base from './base'
import Cursor from './cursor'

export default class extends Base {
    constructor (el, socket, sockets) {
        super(el, {
            autoRender: false,
        })
        if (el instanceof Element) {
            this.socket = socket
            this.sockets = sockets
            this.cursors = {}
            this.mouse = new Vector2()
            this.mousemove = this.mousemove.bind(this)

            this.reqRenders.push(() => {
                this.draw()
            })
        }
    }

    socketEvents () {
        this.sockets.subscribe('get-users', (users) => {
            for (const ID in users) {
                this.addCursor(users[ID])
            }
        })
        this.sockets.subscribe('user-connected', (user) => {
            this.addCursor(user)
        })
        this.sockets.subscribe('user-disconnected', (ID) => {
            this.deleteCursor(ID)
        })
        this.sockets.subscribe('updated-position', (user) => {
            this.updateCursorPosition(user)
        })
        this.sockets.subscribe('updated-color', (user) => {
            this.updateCursorColor(user)
        })
        this.sockets.subscribe('updated-name', (user) => {
            this.updateCursorName(user)
        })
    }

    unSubSocketEvents () {
        this.sockets.unsubscribe('get-users')
        this.sockets.unsubscribe('user-connected')
        this.sockets.unsubscribe('user-disconnected')
        this.sockets.unsubscribe('updated-position')
        this.sockets.unsubscribe('updated-color')
        this.sockets.unsubscribe('updated-name')
    }

    addCursor (user) {
        const { ID, x, y, color, name } = user
        this.cursors[ID] = new Cursor(this.ctx, this.socket, ID, {
            position: new Vector2(x, y),
            color,
            text: name,
        })
    }

    deleteCursor (ID) {
        delete this.cursors[ID]
    }

    updateCursorPosition (user) {
        const { ID, x, y } = user
        if (this.cursors[ID]) {
            this.cursors[ID].options.position.set(x, y)
        }
    }

    updateCursorColor (user) {
        const { ID, color } = user
        this.cursors[ID].options.color = color
    }

    updateCursorName (user) {
        const { ID, name } = user
        this.cursors[ID].changeText(name)
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

    mousemove ({ clientX, clientY }) {
        const { halfWight, halfHeight } = this.viewport
        const x = clientX - halfWight
        const y = clientY - halfHeight
        this.mouse.set(x, y)
    }

    start () {
        this.render()

        window.addEventListener('mousemove', this.mousemove)
        this.socketEvents()
    }

    stop () {
        super.stop()

        window.removeEventListener('mousemove', this.mousemove)
        this.unSubSocketEvents()
    }

    destroy () {
        this.stop()

        super.destroy()
    }
}
