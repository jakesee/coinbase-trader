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

var Trader = require('./trader.js');
var traders = []; // array of traders
traders.push(new Trader('LTC1', calculator, { type: 'buy', fund: 500, currency: 'LTC', limit: 111.46, paymentMethodId: config.xfersId }));
traders.push(new Trader('LTC2', calculator, { type: 'buy', fund: 500, currency: 'LTC', limit: 119.35, paymentMethodId: config.xfersId }));
traders.push(new Trader('LTC3', calculator, { type: 'buy', fund: 500, currency: 'LTC', limit: 124.87, paymentMethodId: config.xfersId }));
traders.push(new Trader('LTC4', calculator, { type: 'buy', fund: 500, currency: 'LTC', limit: 128.44, paymentMethodId: config.xfersId }));

traders.push(new Trader('BTC1', calculator, { type: 'buy', fund: 500, currency: 'BTC', limit: 18839.32, paymentMethodId: config.xfersId }));
traders.push(new Trader('BTC2', calculator, { type: 'buy', fund: 500, currency: 'BTC', limit: 18480.48, paymentMethodId: config.xfersId }));
traders.push(new Trader('BTC3', calculator, { type: 'buy', fund: 500, currency: 'BTC', limit: 17967.13, paymentMethodId: config.xfersId }));
traders.push(new Trader('BTC4', calculator, { type: 'buy', fund: 1000, currency: 'BTC', limit: 16036.78, paymentMethodId: config.xfersId }));
_.each(traders, trader => {
	trader.events.on('*', (event, trader, data) => {
		if(event == 'buy_error' || event == 'sell_error') {
			console.log(data);
		} else {
			var quote = Number(data.subtotal.amount) / Number(data.amount.amount);
			console.log(trader.name, event, trader.order.currency, '@', quote);
		}
	});
});

// Coinbase stuff
var coinbase = require('coinbase').Client;
var client = new coinbase({
	'apiKey': config.apiKey,
	'apiSecret': config.apiSecret
});
var ec = require('./exchange.js');
var exchange = new ec.Exchange(client, ['BTC', 'LTC']);
exchange.events.on(ec.eventNames.spotprice, (exchange, spot) => {
	traders.map(trader => trader.trade(exchange, spot));
});

// start the trading!
var portfolio = wait.for.promise(exchange.init());
console.log(columnify(exchange.getBillboard()));
exchange.run(5000);
