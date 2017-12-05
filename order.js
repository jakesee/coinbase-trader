// defines a trade order
var order = function() {
    // either sell or buy
    this.type = null;

    // the fiat amount to sell
    //  eg. SGD 500
    this.amount = 0;

    // either BTC, LTC or ETH etc.
    this.currency = null;

    // order limit
    //  if sell limit, then sell quote must be higher or equal than limit
    //  if buy limit, then buy quote must be lower or equal than limit
    this.limit = null;
};


module.exports = order;