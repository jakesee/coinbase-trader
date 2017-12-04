// environment
var config = {};
config.apiKey = process.env.apiKey;
config.apiSecret = process.env.apiSecret;
config.xfersId = process.env.xfersId;
config.ccId = process.env.ccId;

// utitlity
var calculator = require('./calculator.js');
var calc = new calculator();
calc.setTargetBuyPrice(135.15, 0);
calc.setPredictSellPrice(140, 0);

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
var handle = tick.add(function(elapsed, delta, stop) {

	// Rate-limiting is 10,000 per hour or 
	if(elapsed - lastTime >= 5000)
	{
		lastTime = elapsed;

		var promises = [
			exchange.getBuyCommit('BTC', config.xfersId, 1000),
			exchange.getSpotPrice('BTC', 'SGD'),
			exchange.getSpotPrice('BTC', 'USD'),

			// exchange.getBuyCommit('LTC', config.xfersId, 1000),
			// exchange.getSpotPrice('LTC', 'SGD'),
			// exchange.getSpotPrice('LTC', 'USD'),
		];

		Promise.all(promises).then(values => {		
			var tx = values[0];
			var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
			quote = quote.toFixed(2);

			var data = [{
				'Value': exchange.portfolio.LTC.principal,
				'Spot BTC/SGD': values[1],
				'Spot BTC/USD': values[2],
				'Quote BTC/SGD': quote,
				'Buy BTC/SGD': calc.targetBuyPrice,
			}];

			// echo data table
			console.log(columnify(data));

			if(quote < calc.targetBuyPrice)
			{
				console.log('Buy @', quote);
				// tx.commit(function(err, response) {
				// 	console.log(response);
				// 	console.log(err);
				// });
				// stop();
			}
		}, failed => {
			console.log(failed);
			stop();
		});
	}
});
