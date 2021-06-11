require('dotenv').config({ path: `../client/.env.${process.env.NODE_ENV}` })
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.VUE_APP_API,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    allowEIO3: true,
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
const users = {}
const chats = []

const getUsers = (socket) => {
    socket.emit('get-users', users)
}

const getUser = (socket) => {
    socket.emit('get-user', users[socket.id])
}

const addUser = (socket) => {
    users[socket.id] = {
        x: Math.random() * 320 - 160,
        y: Math.random() * 320 - 160,
        color: colors[Math.random() * colors.length >> 0],
        name: socket.id,
    }
    io.emit('user-connected', socket.id, users[socket.id])
}

const deleteUser = (socket) => {
    delete users[socket.id]
    io.emit('user-disconnected', socket.id)
}

const updatePosition = (socket, { x, y }) => {
    users[socket.id].x = x
    users[socket.id].y = y
    socket.broadcast.emit('updated-position', socket.id, users[socket.id])
}

const getColors = (socket) => {
    socket.emit('get-colors', colors)
}

const updateColor = (socket, color) => {
    users[socket.id].color = color
    io.emit('updated-color', socket.id, users[socket.id])
}

const updateName = (socket, name) => {
    users[socket.id].name = name
    io.emit('updated-name', socket.id, users[socket.id])
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

io.on('connection', (socket) => {
    // console.log('A user connected')
    socket.emit('client-id', socket.id)
    getChats(socket)
    getColors(socket)
    getUsers(socket)
    addUser(socket)
    getUser(socket)

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

    socket.on('disconnect', function () {
        // console.log('A user disconnected')
        deleteUser(socket)
    })
})

server.listen(3000)
