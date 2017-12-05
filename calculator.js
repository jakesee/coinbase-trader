var calculator = function(sellFeeRate, buyFeeRate) {
	var sellFeeRate = sellFeeRate;
	var buyFeeRate = buyFeeRate;	

	this.calcBuyLimitFromSellLimit = function(sellPrice, targetGain) {
		return ((1 - sellFeeRate) * (1 - buyFeeRate) * sellPrice / (1 + targetGain)).toFixed(2);
	};

	this.calcSellLimitFromBuyLimit = function(buyPrice, targetGain) {
		return (buyPrice / (1 - sellFeeRate) / (1 - buyFeeRate) * (1 + targetGain)).toFixed(2);
	}
};

module.exports = calculator;