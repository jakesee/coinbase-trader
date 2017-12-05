var app = function() {
	// environment
	var config = {};
	config.apiKey = process.env.apiKey;
	config.apiSecret = process.env.apiSecret;
	config.xfersId = process.env.xfersId;
	config.ccId = process.env.ccId;
}

app.prototype.run = function(routine) {
	// Create the game loop
	var tick = require('animation-loops');
	var lastTime = 0;
	var max = 120;
	var handle = tick.add(routine);
};



// utitlity
var calculator = require('./calculator.js');
var LTC = new calculator();
LTC.setPredictSellPrice(140, 0.01);
var BTC = new calculator();
BTC.setPredictSellPrice(15750, 0.005);
BTC.targetBuyPrice = 14300;
console.log("Limit:", BTC.targetBuyPrice);

// fomattting helping
var columnify = require('columnify');
var wait = require('wait-for-stuff');;

// Coinbase stuff
var coinbase = require('coinbase').Client;
var client = new coinbase({
	'apiKey': config.apiKey,
	'apiSecret': config.apiSecret
});
var exchange = require('./exchange.js');
exchange = new exchange(client);
wait.for.promise(exchange.initPortfolio());




function getQuote(tx)
{
	var quote = tx;
	var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
	quote = quote.toFixed(2);
	return quote
}

function checkBuy(quote, buyLimit, tx)
{
	if(buyLimit == 0) return false;

	if(quote < buyLimit)
	{
		console.log('Buy @', quote);
		tx.commit(function(err, response) {
			console.log(response);
			console.log(err);
		});

		return true;
	}

	return false;
}
