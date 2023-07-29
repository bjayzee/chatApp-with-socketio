const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/user');

const formatMessage = require('./utils/message');

const app = express();

const server = http.createServer(app);

const io = socketio(server);

// Run when client connects

io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage('bot', 'Welcome to ChatChord!'));

        //Broadcast when a use connects 
        socket.broadcast.to(user.room).emit('message', formatMessage(user.username, `${user.username} has joined the chat`));

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });



    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage('bot', `${user.username} has left the chat`));


            // send users and roominfo
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        };


    })

    //Listen for chatMessage

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

})


// Set Static folder

app.use(express.static(path.join(__dirname, 'public')));


const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))