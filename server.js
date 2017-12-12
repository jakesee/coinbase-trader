var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var tick = require('animation-loops');
var ec = require('./exchange.js');

// environment
var config = {};
config.apiKey = process.env.apiKey;
config.apiSecret = process.env.apiSecret;
config.xfersId = process.env.xfersId;
config.ccId = process.env.ccId;

var coinbase = require('coinbase').Client;
var client = new coinbase({
    'apiKey': config.apiKey,
    'apiSecret': config.apiSecret
});
var exchange = new ec.Exchange(client, ['BTC']);
exchange.events.on(ec.eventNames.spotprice, (exchange, spot) => {
    io.emit('price.update', spot);
    console.log(spot);
});
exchange.run(5000);


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
