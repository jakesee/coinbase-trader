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

var trader = function(name, calculator, order) {
	
	// identity
	this.name = name;
	var self = this;
	this.events = new events.EventEmitter2({'wildcard': true});

	// options
	_.defaults(order, {
		'type': null,
		'fund': 0,
		'currency': 'BTC',
		'paymentMethodId': null,
		'limit': null,
		'active': true,
	});
	this.order = order;

	// tools
	var calculator = calculator;
	
	// *****************************************
	// privileged functions
	// *****************************************

	this.trade = function(exchange, spot) {

		if(order.active == false || order.fund <= 0) return;
		order.active = false;

		var spotprice = spot[order.currency].amount;
		if(order.type === 'buy' && spotprice <= order.limit)
		{
			attemptBuy(exchange).then((committed) => {
				order.active = !committed;
			}, (err) => {
				console.log(err);
				order.active = true;
			});
		}
		else if(order.type === 'sell' && spotprice >= order.limit)
		{
			attemptSell(exchange).then((committed) => {
				order.active = !committed;
			}, (err) => {
				console.log(err);
				order.active = true;
			});
		}
	}


	// *****************************************
	// private functions
	// *****************************************
	var attemptBuy = function(exchange) {
		return new Promise((resolve, reject) => {
			exchange.getBuyCommit(
				order.currency,
				order.paymentMethodId,
				order.fund,
			).then(tx => {
				var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
				if(quote <= order.limit) {
					exchange.commit(tx).then(tx => {
						self.events.emit(eventNames.bought, eventNames.bought, self, tx);
						resolve(true);
					}, err => {
						self.events.emit(eventNames.buy_error, eventNames.buy_error, self, err);
						reject(err);
					});
				} else {
					self.events.emit(eventNames.buying, eventNames.buying, self, tx);
					resolve(false);
				}
			}, err => {
				self.events.emit(eventNames.buy_error, eventNames.buy_error, self, err);
				reject(err);
			});
		});
	}

	var attemptSell = function(exchange) {
		return new Promise((resolve, reject) => {
			exchange.getSellCommit(
				order.currency,
				order.paymentMethodId,
				order.fund,
			).then(tx => {
				var quote = Number(tx.subtotal.amount) / Number(tx.amount.amount);
				if(quote >= order.limit) {
					exchange.commit(tx).then(tx => {
						self.events.emit(eventNames.sold, eventNames.sold, self, tx);
						resolve(true);
					}, err => {
						self.events.emit(eventNames.sell_error, eventNames.sell_error, self, err);
						reject(err);
					});
				} else {
					self.events.emit(eventNames.selling, eventNames.selling, self, tx);
					resolve(false);
				}
			}, err => {
				self.events.emit(eventNames.sell_error, eventNames.sell_error, self, err);
				reject(err);
			});
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
