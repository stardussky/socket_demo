require('dotenv').config({ path: `../client/.env.${process.env.NODE_ENV}` })
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {
    // cookie: {
    //     name: "socket",
    //     httpOnly: false,
    //     SameSite: 'lax'
    // },
    cors: {
        origin: process.env.VUE_APP_API,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    allowEIO3: true,
})

const options = Object.freeze({
    HISTORY_TIMER: 1000 * 999999
})
const colors = [
    '#f6bd60',
    '#f7ede2',
    '#f5cac3',
    '#84a59d',
    '#f28482',
    '#5bc0eb',
    '#fde74c',
    '#9bc53d',
    '#e55934',
    '#fa7921',
]
const unActiveUsers = {}
const users = {}
const chats = []
const sketchHistory = []
let historyTimerId

const getUsers = (socket) => {
    socket.emit('get-users', users)
}

const getUser = (socket) => {
    socket.emit('get-user', users[socket.id])
}

const addUser = (socket) => {
    unActiveUsers[socket.id] = {
        ID: socket.id,
        name: socket.id,
        x: Math.random() * 320 - 160,
        y: Math.random() * 320 - 160,
        color: colors[Math.random() * colors.length >> 0],
    }
}

const deleteUser = (socket) => {
    delete users[socket.id]
    io.emit('user-disconnected', socket.id)
}

const updatePosition = (socket, { x, y }) => {
    users[socket.id].x = x
    users[socket.id].y = y
    socket.broadcast.emit('updated-position', users[socket.id])
}

const getColors = (socket) => {
    socket.emit('get-colors', colors)
}

const updateColor = (socket, color) => {
    users[socket.id].color = color
    io.emit('updated-color', users[socket.id])
}

const updateName = (socket, name) => {
    users[socket.id].name = name
    io.emit('updated-name', users[socket.id])
}

const getChats = (socket) => {
    socket.emit('get-chats', chats)
}

const addChat = (socket, chat) => {
    const { name, color } = users[socket.id]
    const payload = {
        id: socket.id,
        name,
        color,
        time: Date.now(),
        value: chat,
    }
    chats.push(payload)
    io.emit("updated-chats", payload);
}

const getSketchHistory = (socket) => {
    socket.emit('get-sketch-history', sketchHistory)
}

const historyTimeout = () => {
    const target = sketchHistory[0]
    if(target){
        const { time } = target

        if(!historyTimerId){
            historyTimerId = setTimeout(() => {
                historyTimerId = null
                historyTimeout()
            }, 1000);
        }

        if(Date.now() - time > options.HISTORY_TIMER) {
            sketchHistory.shift()
            deleteSketchHistory()
        }
        return
    }
    clearTimeout(historyTimerId)
    historyTimerId = null
}

const addSketchHistory = (socket, base) => {
    sketchHistory.push({
        time: Date.now(),
        value: base
    })
    historyTimeout()
}

const deleteSketchHistory = () => {
    io.emit('delete-sketch-history', sketchHistory)
}

const updateSketch = (socket, payload) => {
    socket.broadcast.emit('updated-sketch', payload)
}

const userJoin = (socket) => {
    const user = {...unActiveUsers[socket.id]}
    if(user){
        users[socket.id] = user
        delete unActiveUsers[socket.id]
        io.emit('user-connected', user)
    }
}

const userLeave = (socket) => {
    const user = {...users[socket.id]}
    if(user){
        unActiveUsers[socket.id] = user
        delete users[socket.id]
        io.emit('user-disconnected', socket.id)
    }
}

io.on('connection', (socket) => {
    // console.log('A user connected')
    // console.log(socket.handshake.headers.cookie);
    addUser(socket)
    getColors(socket)

    socket.on('update-position', (position) => {
        updatePosition(socket, position)
    })
    socket.on('update-color', (color) => {
        updateColor(socket, color)
    })
    socket.on('update-name', (name) => {
        updateName(socket, name)
    })
    socket.on('submit-chat', (chat) => {
        addChat(socket, chat)
    })
    socket.on('add-sketch-history', (base) => {
        addSketchHistory(socket, base)
    })
    socket.on('update-sketch', (payload) => {
        updateSketch(socket, payload)
    })

    socket.on('join', () => {
        userJoin(socket)
        getUsers(socket)
        getUser(socket)
        getSketchHistory(socket)
        getChats(socket)
    })
    socket.on('leave', () => {
        userLeave(socket)
    })
    socket.on('disconnect', () => {
        // console.log('A user disconnected')
        deleteUser(socket)
    })
})

server.listen(3000)
