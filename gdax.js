const WebSocket = require('ws');
const _ = require('lodash');

module.exports = function(products) {

    // initialization
    var self = this;
    const ws = new WebSocket('wss://ws-feed.gdax.com', { perMessageDeflate: false });
    var bids = {};
    var asks = {};
    var nett = {};
    var ticker = {};
    var products = products;
    _.each(products, product => {
        ticker[product] = { sequence: 0 };
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
            if(data.type == 'snapshot') {
                _.each(data.bids, bid => {
                    var index = Number(bid[0]);
                    bids[index] = {
                        'price': Number(bid[0]),
                        'size': Number(bid[1])
                    };
                });
                _.each(data.asks, ask => {
                    var index = Number(ask[0]);
                    asks[index] = {
                        'price': Number(ask[0]),
                        'size': Number(ask[1])
                    };
                });
            } else if(data.type == 'l2update') {
                _.each(data.changes, change => {
                    var type = change[0];
                    var price = Number(change[1]);
                    var size = Number(change[2]);

                    if(size == 0 && type == 'buy') delete bids[price];
                    else if(size == 0 && type == 'sell') delete asks[price];
                    else {
                        var data = { 'price': price, 'size': size }
                        if(type == 'buy')       bids[price] = data;
                        else if(type == 'sell') asks[price] = data;
                    }
                });
            } else if(data.type == 'ticker') {

                if(data.sequence > ticker[data.product_id].sequence)
                {
                    ticker[data.product_id] = data;
                }
            }
        });
    };

    this.getData = function () { 
        // make a copy so that 
        return {
            'bids': bids,
            'asks': asks,
            'ticker': ticker
        };
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
