var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var firebase = require("firebase");
firebase.initializeApp({
  serviceAccount: "./HyperBot-c52ccadf3e05.json",
  databaseURL: "https://hyperbot-d6494.firebaseio.com"
});

var iPhoneref = firebase.database().ref().child('iPhoneHyper');
iPhoneref.on('value', function(snap){
  console.log(snap.val());
})

app.get('/', function(req, res, next){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    // console.log('a user connected');
    // socket.on('disconnect', function(){
    //     console.log('user disconnected');
    // })
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    })
})

http.listen(3000, function(){
    console.log('listening on *:3000');
});