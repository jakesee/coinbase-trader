"use strict";

var wait = require('wait-for-stuff');
var events = require('eventemitter2');
var _ = require('underscore');

// **********************************
var eventNames = {
	buy_error: 'buy_error',
	sell_error: 'sell_error',
	buying: 'buying',
	bought: 'bought',
	selling: 'selling',
	sold: 'sold',
};

var trader = function(name, calculator, options) {
	
	// identity
	this.name = name;
	var self = this;
	this.events = new events.EventEmitter2({'wildcard': true});

	// options
	this.options = options;
	_.defaults(options, {
		'fund': 500,
		'currency': 'BTC',
		'paymentMethodId': null,
		'buyLimit': -Infinity,
		'sellLimit': Infinity,
		'isSeller': false,
	});

	// tools
	var calculator = calculator;
	var isBusy = false;
	
	// *****************************************
	// privileged functions
	// *****************************************

	this.trade = function(exchange, spotPrice) {

		if(isBusy) return;
		isBusy = true;

		// check whether to buy
		var spot = spotPrice[options.currency].amount;
		if(options.isSeller === false && spot <= options.buyLimit)
		{
			attemptBuy(exchange);
		}
		else if(options.isSeller === true && spot >= options.sellLimit)
		{
			attemptSell(exchange);
		}

		isBusy = false;
	}


	// *****************************************
	// private functions
	// *****************************************

	var attemptBuy = function(exchange) {
		exchange.getBuyCommit(
			options.currency,
			options.paymentMethodId,
			options.fund,
		).then(tx => {
			var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
			if(quote <= options.buyLimit) {
				exchange.commit(tx).then(tx => {
					// toggle seller/buyer status
					self.options.isSeller = true;
					self.events.emit(eventNames.bought, self, tx);
				});
			}
			else
			{
				self.events.emit(eventNames.buying, eventNames.buying, self, tx);	
			}
		}, err => {
			self.events.emit(eventNames.buy_error, eventNames.buy_error, self, err);	
		});
	}

	var attemptSell = function(exchange) {
		exchange.getSellCommit(
			options.currency,
			options.paymentMethodId,
			options.fund,
		).then(tx => {
			var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
			if(quote >= options.sellLimit) {
				exchange.commit(tx).then(tx => {
					// toggle seller/buyer status
					self.options.isSeller = false;
					self.events.emit(eventNames.sold, eventNames.sold, self, tx);
				});
			}
			else
			{
				self.events.emit(eventNames.selling, eventNames.selling, self, tx);	
			}
		}, err => {
			self.events.emit(eventNames.sell_error, eventNames.sell_error, self, err);
			console.log(err);
		});
	}
};

function mock_action(data) {
	return new Promise((resolve, reject) => {
		wait.for.time(3);
		resolve(data);
	});
}


module.exports = trader;
