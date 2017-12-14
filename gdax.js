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
    		'ticker': { price:0, size: 0, sequence: 0 },
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
