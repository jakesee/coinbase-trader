"use strict";

var wait = require('wait-for-stuff');
var events = require('eventemitter2');
var _ = require('lodash');

// **********************************

var eventNames = {
	error: 'error',
	spotprice: 'spotprice'
};

var exchange = function(client, currencies) {

	var self = this;
	this.client = client;
	this.events = new events.EventEmitter2({'wildcard': true}); 

	// the currencies that the exchange will fetch
	var currencies = currencies;

	// history
	var history = null;
	var performance = {};
	var handle = null;
	var isMock = true;

	// fetch prices
	this.run = function(interval) {
		var lastTime = 0;
		var tick = require('animation-loops');
		this.handle = tick.add(function(elapsed, delta, stop) {
			if(elapsed - lastTime > interval)
			{
				lastTime = elapsed;

				var promises = currencies.map(currency => self.getSpotPrice(currency, 'SGD'));
				var timestamp = new Date().getTime();

				Promise.all(promises).then(values => {
					var spot = {};
					values.forEach(value => {
						var price = value.data;
						price.timestamp = timestamp;
						spot[price.base] = price;
						spot[price.base].amount = Number(spot[price.base].amount);
					});

					self.events.emit(eventNames.spotprice, self, spot);
				}, error => {
					self.events.emit(eventNames.error, self, error);
				});
			}
		});

		return this;
	};

	this.live = function() {
		isMock = false;
		console.log('Running in live mode.');
	}

	this.stop = function() {
		this.handle.stop();
	};

	this.commit = function(tx) {
		if(isMock === true)
		{
			return new Promise((resolve, reject) => {
				resolve({
					'subtotal': { amount: 123 },
					'amount': { amount: 321 }
				});
			});
		}
		else
		{
			return new Promise((resolve, reject) => {
				tx.commit((err, response) => {
					if(err != null) reject(err);
					else resolve(tx);
				});
			});
		}
	};
}

exchange.prototype.getSpotPrice = function(digitalCurrency, fiatCurrency) {
	return new Promise((resolve, reject) => {
		this.client.getSpotPrice({'currencyPair': digitalCurrency + '-' + fiatCurrency}, function(err, obj) {
			// resolve(Number(obj.data.amount).toFixed(2));
			resolve(obj);
		});
	});
}

exchange.prototype.getBuyCommit = function(digitalCurrency, paymentMethodId, buyTotal) {
	return new Promise((resolve, reject) => {
		this.client.getAccount(this.portfolio[digitalCurrency].id, function(err, account) {
			account.buy({
				'total' : buyTotal,
				'currency' : 'SGD',
				'payment_method': paymentMethodId,
				'commit' : false,
			}, function(err, tx) {
				if(err != null) reject(err);
				else resolve(tx);
			});
		});
	});
}

exchange.prototype.getSellCommit = function(digitalCurrency, paymentMethodId, sellTotal) {
	return new Promise((resolve, reject) => {
		this.client.getAccount(this.portfolio[digitalCurrency].id, function(err, account) {
			account.sell({
				'total' : sellTotal,
				'currency' : 'SGD',
				'payment_method': paymentMethodId,
				'commit' : false,
			}, function(err, tx) {
				if(err != null) reject(err);
				else resolve(tx);
			});
		});
	});
}

exchange.prototype.getAccounts = function() {
	return new Promise((resolve, reject) => {
		this.client.getAccounts({}, function(err, accounts) {
			if(err != null) reject(err);
			else resolve(accounts);
		});	
	});
}

exchange.prototype.getAccount = function(accountId) {
	return new Promise((resolve, reject) => {
		this.client.getAccount(accountId, function(err, account) {
			if(err != null) reject(err);
			else resolve(account);
		});
	});
}

exchange.prototype.getTransactions = function(account) {
	return new Promise((resolve, reject) => {
		account.getTransactions({}, function(err, txs) {
			if(err != null) reject(err);
			else resolve(txs);
		});
	});
};

exchange.prototype.init = function() {
	return new Promise((resolve, reject) => {

		var portfolio = {};
		var completed = 0;
		var required = Infinity;

		this.client.getAccounts({}, function(err, accounts) {
			if(err != null) reject(err);
			else {
				required = accounts.length;
				accounts.forEach(account => {

					// create currency
					portfolio[account.currency] = {};
					portfolio[account.currency].id = account.id;
					portfolio[account.currency].amount = account.balance.amount;
					portfolio[account.currency].principal = 0;
					portfolio[account.currency].transactions = [];

					account.getTransactions({}, function(err, txs) {
						if(err != null) reject(err);
						else
						{
							txs.forEach(tx => {
								if(tx.type === 'buy' || tx.type === 'sell') {
									portfolio[account.currency].principal += Number(tx.native_amount.amount);
									portfolio[account.currency].transactions.push({
										'type': tx.type,
										'digital': tx.amount.currency,
										'fiat': Number(tx.native_amount.amount),
										'coin': Number(tx.amount.amount),
									});
								}
							});

							completed++;
						}
					});
				});
			}
		});

		wait.for.predicate(() => completed >= required);

		// save the portfolio data
		this.portfolio = portfolio;

		resolve(this.portfolio);
	});
}

exchange.prototype.getBillboard = function() {

	var calculator = require('./calculator.js');
	calculator = new calculator(0.015, 0.015);

	var data = [];
	_.each(this.portfolio, (coin) => {
		_.each(coin.transactions, tx => {
			if(tx.type === 'buy')
			{
				var rate = (tx.fiat / tx.coin).toFixed(2);
				data.push({
					'type': tx.type,
					'digital': tx.digital,
					'fiat': tx.fiat,
					'rate': rate,
					'sell @ 0%': calculator.calcSellLimitFromBuyLimit(rate, 0),
					'sell @ 1%': calculator.calcSellLimitFromBuyLimit(rate, 0.01),
					'sell @ 2%': calculator.calcSellLimitFromBuyLimit(rate, 0.02),
					'sell @ 3%': calculator.calcSellLimitFromBuyLimit(rate, 0.03),
					'sell @ 5%': calculator.calcSellLimitFromBuyLimit(rate, 0.05),
					'sell @ 8%': calculator.calcSellLimitFromBuyLimit(rate, 0.08),
					'sell @ 13%': calculator.calcSellLimitFromBuyLimit(rate, 0.13),
					'sell @ 21%': calculator.calcSellLimitFromBuyLimit(rate, 0.21),
				});
			}
		});
	});

	return data;
}

module.exports = {
	Exchange: exchange,
	eventNames: eventNames,
};
