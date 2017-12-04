var calculator = function(sellFeeRate, buyFeeRate) {
	this.sellFeeRate = 0.015;
	this.buyFeeRate = 0.015;	

	this.calcBuyPriceFromSellPrice = function(sellPrice, targetGain) {
		return ((1 - this.sellFeeRate) * (1 - this.buyFeeRate) * sellPrice / (1 + targetGain)).toFixed(2);
	};

	this.calcSellPriceFromBuyPrice = function(buyPrice, targetGain) {
		return (buyPrice / (1 - this.sellFeeRate) / (1 - this.buyFeeRate) * (1 + targetGain)).toFixed(2);
	}
};

module.exports = calculator;