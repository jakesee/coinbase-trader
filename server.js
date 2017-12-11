var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var tick = require('animation-loops');

lastTime = 0;
tick.add((elapsed, delta, stop) => {
    if(elapsed - lastTime >= 5000)
    {
        lastTime = elapsed;
        io.emit('tick', elapsed);
        console.log(elapsed);
    }
});

io.on('connection', (socket) => {
    console.log('connected');
});

app.use('/', express.static(__dirname));
app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
    console.log('Listening on *:3000');
});
