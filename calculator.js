var calculator = function() {
	this.sellFeeRate = 0.015;
	this.buyFeeRate = 0.015;	

	this.targetSellPrice = 0;
	this.targetBuyPrice = 0;

	this.setPredictSellPrice = function(sellPrice, targetGain) {
		this.targetSellPrice = sellPrice;
		this.targetBuyPrice = ((1 - this.sellFeeRate) * (1 - this.buyFeeRate) * sellPrice / (1 + targetGain)).toFixed(2);
	};

	this.setTargetBuyPrice = function(buyPrice, targetGain) {
		this.targetBuyPrice = buyPrice;
		this.targetSellPrice = (buyPrice / (1 - this.sellFeeRate) / (1 - this.buyFeeRate) * (1 + targetGain)).toFixed(2);
	}
};

module.exports = calculator;