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


var portfolio = wait.for.promise(exchange.getPortfolio());

var nettPrincipal = portfolio.BTC.principal + portfolio.ETH.principal + portfolio.LTC.principal;

console.log(nettPrincipal);
process.exit(); TODO

// Create the game loop
var tick = require('animation-loops');
var lastTime = 0;
var handle = tick.add(function(elapsed, delta, stop) {

	// Rate-limiting is 10,000 per hour or 
	if(elapsed - lastTime >= 5000)
	{
		lastTime = elapsed;

		var promises = [
			getBuyCommit('LTC', config.xfersId, 1000, false),

			getSpotPrice('LTC', 'SGD'),
			// getSpotPrice('ETH', 'SGD'),
			// getSpotPrice('LTC', 'SGD'),

			getSpotPrice('LTC', 'USD'),
			// getSpotPrice('ETH', 'USD'),
			// getSpotPrice('LTC', 'USD'),
		];

		Promise.all(promises).then(values => {
			
			var tx = values[0];
			var btcCommit = Number(tx.subtotal.amount) / Number(tx.amount.amount);
			btcCommit = btcCommit.toFixed(2);

			var data = [{
				'Value': portfolio.LTC.principal,
				'Spot LTC/SGD': values[1],
				'Spot LTC/USD': values[2],
				'Quote LTC/SGD': btcCommit,
				'Buy LTC/SGD': calc.targetBuyPrice,
			}];

			console.log(columnify(data));

			if(btcCommit < calc.targetBuyPrice)
			{
				// tx.commit(function(err, response) {
				// 	console.log(response);
				// 	console.log(err);
				// });
				// stop();
			}
		})
	}
});

function getSpotPrice(digitalCurrency, fiatCurrency) {
	return new Promise((resolve, reject) => {
		client.getSpotPrice({'currencyPair': digitalCurrency + '-' + fiatCurrency}, function(err, obj) {
			resolve(Number(obj.data.amount).toFixed(2));
		});
	});
}

function getBuyCommit(digitalCurrency, paymentMethodId, buyTotal, commit) {
	return new Promise((resolve, reject) => {
		client.getAccount(portfolio[digitalCurrency].id, function(err, account) {
			account.buy({
				'total' : buyTotal,
				'currency' : 'SGD',
				'payment_method': paymentMethodId,
				'commit' : commit,
			}, function(err, tx) {
				resolve(tx);
			});
		});
	});
}









