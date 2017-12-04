var trader = function(name, currency, fund, calculator) {
	this.name = name;
	this.fund = fund;
	this.currency = currency;
	this.paymentMethodId = null;

	this.calculator = calculator;
};

trader.prototype.trade = function() {
	console.log('I am', this.name);
};

trader.prototype.read = function(spotPrice) {
	
};

//**************************************************

var calculator = require('./calculator.js');
var calculator = new calculator(0.015, 0.015);
var btcTrader1 = new trader('btcTrader1', 'BTC', 500, calculator);
var btcTrader2 = new trader('btcTrader2', 'BTC', 500, calculator);
var ltcTrader3 = new trader('ltcTrader3', 'LTC', 500, calculator);
var ltcTrader4 = new trader('ltcTrader4', 'LTC', 500, calculator);

module.exports = {
	traders: [
		btcTrader1,
		btcTrader2,
		ltcTrader3,
		ltcTrader4,
	]
};