const WebSocket = require('ws');
const _ = require('lodash');

module.exports = function(products) {

    // initialization
    var self = this;
    const ws = new WebSocket('wss://ws-feed.gdax.com', { perMessageDeflate: false });
    var feed = {};
    var products = products;
    _.each(products, product => {
    	feed[product] = {
    		'ticker': { price:0, last_size: 0, sequence: 0, volume: 0 },
    		'bids': {}, // hash
    		'asks': {}, // hash
    	}
    });

    this.run = function() {
        // open the GDAX WebSocket Feed
        ws.on('open',() => {
            var request = {
                "type": "subscribe",
                "channels": [
                        { "name": "level2", "product_ids": products },
                        { "name": "ticker", "product_ids": products }
                ]
            };
            ws.send(JSON.stringify(request));
        });

        // As the data streams in, update our data structures
        ws.on('message', data => {
            var data = JSON.parse(data);
            var product_id = data.product_id;
            if(data.type == 'snapshot') {
                _.each(data.bids, bid => {
                	let price = Number(bid[0]);
                	let size = Number(bid[1]);
                    feed[product_id].bids[price] = { 'price': price, 'size': size };
                });
                _.each(data.asks, ask => {
                	let price = Number(ask[0]);
                	let size = Number(ask[1]);
                    feed[product_id].asks[price] = { 'price': price, 'size': size };
                });
            } else if(data.type == 'l2update') {
                _.each(data.changes, change => {
                    var type = change[0];
                    var price = Number(change[1]);
                    var size = Number(change[2]);

                    if(size == 0 && type == 'buy') delete feed[product_id].bids[price];
                    else if(size == 0 && type == 'sell') delete feed[product_id].asks[price];
                    else {
                        var data = { 'price': price, 'size': size }
                        if(type == 'buy')       feed[product_id].bids[price] = data;
                        else if(type == 'sell') feed[product_id].asks[price] = data;
                    }
                });
            } else if(data.type == 'ticker') {
                if(data.sequence > feed[product_id].ticker.sequence)
                {
       			    // { type: 'ticker',
					  // sequence: 1707529262,
					  // product_id: 'ETH-USD',
					  // price: 651.13,
					  // open_24h: '736.79000000',
					  // volume_24h: '388070.47936022',
					  // low_24h: '651.13000000',
					  // high_24h: '736.82000000',
					  // volume_30d: '8730314.94006487',
					  // best_bid: '651.13',
					  // best_ask: '651.14',
					  // side: 'sell',
					  // time: '2017-12-15T12:44:24.164000Z',
					  // trade_id: 21429648,
					  // last_size: 0.00230368 }
                    data.price = Number(data.price);
                    data.last_size = Number(data.last_size || 0);
                    data.volume = feed[product_id].ticker.volume;
					/*
                	selling = asking, buying = bidding
                	if side = buy, then price is ask price, because buyer yield to seller, therefore spot price increase
                	if side = sell, then price is buy price, because seller yield to buyer, therefore spot price decrease
                	*/
                    data.volume += data.last_size * (data.side === 'buy' ? 1 : -1);
                	feed[product_id].ticker = data;
                }
            }
        });
    };

    this.getData = function () { 
        var data = {};
        _.each(products, product => {
        	data[product] = {
	        	'ticker': feed[product].ticker,
	        	'bids': _.orderBy(feed[product].bids, ['price'], ['desc']),
	        	'asks': _.orderBy(feed[product].asks, ['price'], ['asc']),
        	};
        });
        return data;
    }

    function getNettSizeAroundPrice(high, low)
    {
        // calculate the nett = bids - asks
        var totalBids = _.reduce(bids, (total, bid) => {
            if(bid.price <= high)
            {
                return total + Number(bid.size);
            }
        }, 0);
        var totalAsks = _.reduce(asks, (total, ask) => {
            return total + Number(ask.size);
        }, 0);
        var totalSize = totalBids - totalAsks;

        return totalSize;
    }
}
