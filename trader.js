"use strict";

var wait = require('wait-for-stuff');
var events = require('events');
var _ = require('underscore');

// **********************************
var eventNames = {
	error: 'error',
	buying: 'buying',
	bought: 'bought',
	selling: 'selling',
	sold: 'sold',
};

var trader = function(name, calculator, options) {
	
	// identity
	this.name = name;
	var self = this;
	this.events = new events.EventEmitter();

	// options
	this.options = options;
	_.defaults(options, {
		fund: 500,
		currency: 'BTC',
		paymentMethodId: null,
		buyLimit: 0,
		sellLimit: Infinity
	});

	// tools
	var calculator = calculator;
	var busy = false;
	var seller = false;

	this.trade = function(exchange, spotPrice) {

		if(busy) return;

		// check whether to buy
		var spot = spotPrice[options.currency].amount;
		if(seller === false && spot <= options.buyLimit)
		{
			exchange.getBuyCommit(
				options.currency,
				options.paymentMethodId,
				options.fund,
			).then(tx => {
				var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
				if(quote <= options.buyLimit) {
					exchange.commit(tx).then(tx => {
						self.events.emit(eventNames.bought, self, tx);
					});

					exchange.stop();
				}
				else
				{
					self.events.emit(eventNames.buying, self, tx);	
				}
			});
		}
		else if(seller === true && spot >= options.sellLimit)
		{
			// exchange.getSellCommit();
			console.log(name, 'could have sold', options.currency, '@', spot);
		}
		else
		{
			console.log(name, "not trading");
		}

		busy = false;
	}
};

function mock_action(data) {
	return new Promise((resolve, reject) => {
		wait.for.time(3);
		resolve(data);
	});
}


module.exports = trader;