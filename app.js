'use strict';

// fomattting helping
var columnify = require('columnify');
var wait = require('wait-for-stuff');
var _ = require('underscore');

// environment
var config = {};
config.apiKey = process.env.apiKey;
config.apiSecret = process.env.apiSecret;
config.xfersId = process.env.xfersId;
config.ccId = process.env.ccId;

// utitlity
var calculator = require('./calculator.js');
calculator = new calculator(0.015, 0.015);

var trader = require('./trader.js');
trader = new trader('BTCTrader', calculator, {
	fund: 500,
	currency: 'BTC',
	paymentMethodId: config.xfersId,
	buyLimit: 14673.44, // spot price cannot be negative, so wont buy
	sellLimit: 17089.84,
	isSeller: true,
});
trader.events.on('*', (event, trader, tx) => {
	var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
	console.log(trader.name, event, trader.options.currency, '@', quote);
})

// Coinbase stuff
var coinbase = require('coinbase').Client;
var client = new coinbase({
	'apiKey': config.apiKey,
	'apiSecret': config.apiSecret
});
var ec = require('./exchange.js');
var exchange = new ec.Exchange(client, ['BTC']);
exchange.events.on(ec.eventNames.spotprice, trader.trade);


// start the trading!
var portfolio = wait.for.promise(exchange.init());
console.log(portfolio.BTC.transactions);
console.log(columnify(exchange.getBillboard()));
// exchange.run(5000).mock();
