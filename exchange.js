"use strict";

var wait = require('wait-for-stuff');
var events = require('events');

// **********************************

var eventNames = {
	error: 'error',
	spotprice: 'spotprice'
};

var exchange = function(client, currencies) {

	var self = this;
	this.client = client;
	this.events = new events.EventEmitter(); 

	// the currencies that the exchange will fetch
	var currencies = currencies;

	// history
	var history = null;
	var performance = {};
	var handle = null;

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
					var spot = [];
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
	};

	this.stop = function() {
		this.handle.stop();
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

exchange.prototype.commit = function(tx) {
	return new Promise((resolve, reject) => {
		tx.commit((err, response) => {
			if(err != null) reject(err);
			else resolve(tx);
		});
	});
};

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

					account.getTransactions({}, function(err, txs) {
						if(err != null) reject(err);
						else
						{
							txs.forEach(tx => {
								if(tx.type === 'buy') {
									portfolio[account.currency].principal += Number(tx.native_amount.amount);
								}
								else if(tx.type === 'sell') {
									portfolio[account.currency].principal += Number(tx.native_amount.amount);
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



module.exports = {
	Exchange: exchange,
	eventNames: eventNames,
};