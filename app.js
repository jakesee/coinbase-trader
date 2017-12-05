'use strict';

// fomattting helping
var columnify = require('columnify');
var wait = require('wait-for-stuff');;

// environment
var config = {};
config.apiKey = process.env.apiKey;
config.apiSecret = process.env.apiSecret;
config.xfersId = process.env.xfersId;
config.ccId = process.env.ccId;

// utitlity
var calculator = require('./calculator.js');
calculator = new calculator(0.015, 0.015);

// traders
var trader = require('./trader.js');
trader = new trader('BTCTrader', calculator, {
	fund: 400,
	currency: 'LTC',
	paymentMethodId: config.xfersId,
	buyLimit: 139.2,
	sellLimit: Infinity
});
trader.events.on('bought', (trader, tx) => {
	var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
	console.log(trader.name, 'bought', trader.options.currency, '@', quote);
});
trader.events.on('buying', (trader, tx) => {
	var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
	console.log(trader.name, 'buying', trader.options.currency, '@', quote);
});

// Coinbase stuff
var coinbase = require('coinbase').Client;
var client = new coinbase({
	'apiKey': config.apiKey,
	'apiSecret': config.apiSecret
});
var ec = require('./exchange.js');
var exchange = new ec.Exchange(client, ['LTC']);
exchange.events.on(ec.eventNames.spotprice, trader.trade);


// start the trading!
wait.for.promise(exchange.init());
exchange.run(5000);
