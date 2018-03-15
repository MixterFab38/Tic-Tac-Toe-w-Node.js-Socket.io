const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

var rooms = 0;

app.use(express.static('.'));

app.get('/', function(req, res) {

    var newGame = "Nouvelle partie";
    var join = "Rejoindre";
    var name = "Entrer votre nom";
    var email = "Entrer votre mail";
    var idRoom = "Entrer l'ID de la room";

    res.render('game.ejs', {
        newGame: newGame,
        join: join,
        name: name,
        email: email,
        idRoom: idRoom,
    });
});

app.get('/', function(req, res) {

    res.render('main.js');
});

io.on('connection', (socket) => {

    // Quand le serveur reçoit un signal de type "message" du client    
    io.sockets.on('connection', function (socket) {
        socket.emit('faitUneAlerte');
    });


    // Create a new game room and notify the creator of game.
    socket.on('createGame', (data) => {
        socket.join(`room-${++rooms}`);
        socket.emit('newGame', { name: data.name, room: `room-${rooms}` });
    });

    // Connect the Player 2 to the room he requested. Show error if room full.
    socket.on('joinGame', function (data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('player1', {});
            socket.emit('player2', { name: data.name, room: data.room })
        } else {
            console.log('La room est complete !')
        }
    });
    /**
       * Handle the turn played by either player and notify the other.
       */
    socket.on('playTurn', (data) => {
        socket.broadcast.to(data.room).emit('turnPlayed', {
            tile: data.tile,
            room: data.room
        });
    });

    socket.on('win', function(message) 
    {
        console.log("" + message);
    });

     socket.on('loos', function(message) 
    {
        console.log("" + message);
    });

    socket.on('message-newGame', function(message) 
    {
        console.log("" + message);
    });

    socket.on('message-joinGame', function(message) 
    {
        console.log("" + message);
    });

    socket.on('player', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case1', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case2', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case3', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case4', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case5', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case6', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case7', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case8', function(message) 
    {
        console.log("" + message);
    });

    socket.on('case9', function(message) 
    {
        console.log("" + message);
    });



});

server.listen(process.env.PORT || 5000);