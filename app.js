

// Coinbase stuff
var config = require('./config.js');
var config = new config();

var coinbase = require('coinbase').Client;
var client = new coinbase({
	'apiKey': config.apiKey,
	'apiSecret': config.apiSecret
});

var wallet = function() {
	this.id = 0;
	this.amount = 0;
	this.invested = 0;
	this.buyPrice = 0;
	this.sellPrice = 0;
	this.spotPrice = 0;
	this.spread = function() { return (this.buyPrice - this.sellPrice).toFixed(2); };
	this.value = function() { return (this.sellPrice * this.amount).toFixed(2); }
	this.gain = function() { return (this.value()  - this.invested).toFixed(2); };
};
var wallets = {
	'BTC': new wallet,
	'ETH': new wallet,
	'LTC': new wallet,
	totalGain: function() {
		return (Number(this.BTC.gain()) + Number(this.LTC.gain()) + Number(this.ETH.gain())).toFixed(2);
	},
	totalInvested: function() {
		return Number(this.BTC.invested) + Number(this.LTC.invested) + Number(this.ETH.invested);	
	},
	totalGainPercent: function() {
		return (this.totalGain() / this.totalInvested() * 100).toFixed(2);
	},
};

// This chunk of code will populate wallets data, but this is asynchornous,
// so we will need to wait for it to complete before making any trade decisions
client.getAccounts({}, function(err, accounts) {
	accounts.forEach(function(account) {
		var type = account.balance.currency;
		wallets[type]['id'] = account.id;
		wallets[type]['amount'] = Number(account.balance.amount);

		client.getAccount(account.id, function(err, acc) {
			acc.getTransactions({}, function(err, txs) {
				txs.forEach(function(tx) {
					if(tx.type === 'buy')
					{
						wallets[type]['invested'] += Number(tx.native_amount.amount);
					}
					else if(tx.type === 'sell')
					{
						wallets[type]['invested'] -= Number(tx.native_amount.amount);	
					}
				});
			});
		});
	});
});

// Create the game loop
var tick = require('animation-loops');
var lastTime = 0;
var handle = tick.add(function(elapsed, delta, stop) {

	if(elapsed - lastTime >= 5000) {
		lastTime = elapsed;

		var promises = [
			getBuyPrice('BTC', 'SGD'),
			getBuyPrice('ETH', 'SGD'),
			getBuyPrice('LTC', 'SGD'),

			getSellPrice('BTC', 'SGD'),
			getSellPrice('ETH', 'SGD'),
			getSellPrice('LTC', 'SGD'),

			getSpotPrice('BTC', 'SGD'),
			getSpotPrice('ETH', 'SGD'),
			getSpotPrice('LTC', 'SGD'),

			getBuyQuote('BTC', config.xfersId),
		];

		Promise.all(promises).then(values => {
			console.log('\033c');
			console.log('BTC: invested $', wallets['BTC'].invested, '; current value: $', wallets['BTC'].value(), '; gain: $', wallets['BTC'].gain());
			console.log('ETH: invested $', wallets['ETH'].invested, '; current value: $', wallets['ETH'].value(), '; gain: $', wallets['ETH'].gain());
			console.log('LTC: invested $', wallets['LTC'].invested, '; current value: $', wallets['LTC'].value(), '; gain: $', wallets['LTC'].gain());
			console.log('Total Gain: $', wallets.totalGain());
			console.log('Total Invested: $', wallets.totalInvested());
			console.log('Gain (%): ', wallets.totalGainPercent(), '%');
			console.log('\n');
			console.log('BTC: $', Number(wallets['BTC'].buyPrice).toFixed(2), '/ $', Number(wallets['BTC'].spotPrice).toFixed(2));
			console.log('ETH: $', Number(wallets['ETH'].buyPrice).toFixed(2), '/ $', Number(wallets['ETH'].spotPrice).toFixed(2));
			console.log('LTC: $', Number(wallets['LTC'].buyPrice).toFixed(2), '/ $', Number(wallets['LTC'].spotPrice).toFixed(2));

			console.log(wallets['BTC'].buyQuote);
		})
	}
});


function getBuyPrice(digitalCurrency, fiatCurrency)
{
	return new Promise((resolve, reject) => {
		client.getBuyPrice({'currencyPair': digitalCurrency + '-' + fiatCurrency}, function(err, obj) {
			wallets[digitalCurrency].buyPrice = obj.data.amount

			resolve(digitalCurrency + '-' + fiatCurrency);
		});
	});
}

function getBuyQuote(digitalCurrency, paymentMethodId)
{
	return new Promise((resolve, reject) => {
		client.getAccount(wallets[digitalCurrency].id, function(err, account) {
			account.buy({
				'amount' : 1,
				'currency': digitalCurrency,
				'payment_method': paymentMethodId,
				'quote' : true,
			}, function(err, tx) {
				wallets[digitalCurrency].buyQuote = tx;

				resolve('getBuyQuote: ' + digitalCurrency);
			});
		});
	});
}

function getSellPrice(digitalCurrency, fiatCurrency)
{
	return new Promise((resolve, reject) => {
		client.getSellPrice({'currencyPair': digitalCurrency + '-' + fiatCurrency}, function(err, obj) {
			wallets[digitalCurrency].sellPrice = obj.data.amount

			resolve(digitalCurrency + '-' + fiatCurrency);
		});
	});
}

function getSpotPrice(digitalCurrency, fiatCurrency)
{
	return new Promise((resolve, reject) => {
		client.getSpotPrice({'currencyPair': digitalCurrency + '-' + fiatCurrency}, function(err, obj) {
			wallets[digitalCurrency].spotPrice = obj.data.amount

			resolve(digitalCurrency + '-' + fiatCurrency);
		});
	});
}


// Create the server
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const hostname = '0.0.0.0';
const port = 3000;

// create the app

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/resources/views/index.html');
});

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('disconnect', function(socket) {
		console.log('user disconnected');
	});

	socket.on('chat message', function(msg) {
		console.log('Message: ' + msg);
		io.emit('chat message', msg);
	});
});

http.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
