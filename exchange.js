var wait = require('wait-for-stuff');

// **********************************

var exchange = function(client) {
	this.client = client;
}

exchange.prototype.getSpotPrice = function(digitalCurrency, fiatCurrency) {
	return new Promise((resolve, reject) => {
		this.client.getSpotPrice({'currencyPair': digitalCurrency + '-' + fiatCurrency}, function(err, obj) {
			resolve(Number(obj.data.amount).toFixed(2));
		});
	});
}

exchange.prototype.getSellPrice = function(digitalCurrency, fiatCurrency)
{
	return new Promise((resolve, reject) => {
		this.client.getSellPrice({'currencyPair': digitalCurrency + '-' + fiatCurrency}, function(err, obj) {
			resolve(Number(obj.data.amount).toFixed(2));
		});
	});
}

exchange.prototype.getBuyCommit = function(digitalCurrency, paymentMethodId, buyTotal) {
	return new Promise((resolve, reject) => {
		coinbase.getAccount(portfolio[digitalCurrency].id, function(err, account) {
			account.buy({
				'total' : buyTotal,
				'currency' : 'SGD',
				'payment_method': paymentMethodId,
				'commit' : false,
			}, function(err, tx) {
				resolve(tx);
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

exchange.prototype.getPortfolio = function() {
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

		resolve(portfolio);
	});
}

module.exports = exchange;