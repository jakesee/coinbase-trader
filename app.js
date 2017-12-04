// environment
var config = {};
config.apiKey = process.env.apiKey;
config.apiSecret = process.env.apiSecret;
config.xfersId = process.env.xfersId;
config.ccId = process.env.ccId;

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

// Create the game loop
var tick = require('animation-loops');
var lastTime = 0;
var max = 120;
var handle = tick.add(function(elapsed, delta, stop) {

	// Rate-limiting is 10,000 per hour or 
	if(elapsed - lastTime >= 5000)
	{
		lastTime = elapsed;

		var promises = [
			exchange.getBuyCommit('BTC', config.xfersId, max),
			// exchange.getBuyCommit('LTC', config.xfersId, 1000),
			// exchange.getSpotPrice('BTC', 'SGD'),
			// exchange.getSpotPrice('BTC', 'USD'),

			// exchange.getBuyCommit('LTC', config.xfersId, 1000),
			// exchange.getSpotPrice('LTC', 'SGD'),
			// exchange.getSpotPrice('LTC', 'USD'),
		];

		Promise.all(promises).then(values => {		

			max++;
			var btcTx = values[0];
			var btcQuote = getQuote(values[0]);
			// var ltcTx = values[1];
			// var ltcQuote = getQuote(values[1]);		

			// var data = [{
			// 	'Value': exchange.portfolio.LTC.principal,
			// 	'Spot BTC/SGD': values[1],
			// 	'Spot BTC/USD': values[2],
			// 	'Quote BTC/SGD': quote,
			// 	'Buy BTC/SGD': calc.targetBuyPrice,
			// }];

			// // echo data table
			// console.log(columnify([{
			// 		'Quote BTC/SGD': btcQuote,
			// 		'Limit BTC/SGD': BTC.targetBuyPrice,

			// 		// 'Quote LTC/SGD': ltcQuote,
			// 		// 'Limit LTC/SGD': LTC.targetBuyPrice,
			// 	}]));

			if(checkBuy(btcQuote, BTC.targetBuyPrice, btcTx))
			{
				BTC.targetBuyPrice = 0;
				stop();
			}

			// if(checkBuy(ltcQuote, LTC.targetBuyPrice, ltcTx))
			// {
			// 	LTC.targetBuyPrice = 0;
			// }

			// if(LTC.targetBuyPrice + BTC.targetBuyPrice == 0)
			// {
			// 	stop();
			// }

		}, failed => {
			// console.log('Cannot buy ', max);
			max--;
		});
	}
});


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
