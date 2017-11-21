/*
 * Duplicate and rename this file as config.js
 * WARNING: do not share your API key and secret to public repositories!!
 */

var config = function() {
    this.apiKey = 'xxx'; // coinbase API key
    this.apiSecret = 'xxx'; // coinbase API secret

    this.buyPercent = 0.0399;
    this.sellPercent = 0.0149;
}
module.exports = config;
