var Gdax = require('./gdax.js');
var tick = require('animation-loops');
var columnify = require('columnify');
var _ = require('lodash');
// formatting numbers: http://mathjs.org/docs/reference/functions/format.html

var gdax = new Gdax(['BTC-USD', 'ETH-USD', 'ETH-BTC', 'LTC-USD', 'LTC-BTC']);

gdax.run();

var lastTime = 0;
tick.add((elapsed, delta, stop) => {

	if(elapsed - lastTime < 5000) return; // too early

	lastTime = elapsed;

	// get a copy of the data to work on
	// so the the internal copy can keep up dating without problems
	var data = gdax.getData(); // this data may be outdated by milliseconds

	// { type: 'ticker',
	//   sequence: 4558296748,
	//   product_id: 'BTC-USD',
	//   price: '16798.99000000',
	//   open_24h: '17067.22000000',
	//   volume_24h: '26496.61688101',
	//   low_24h: '16798.99000000',
	//   high_24h: '17746.73000000',
	//   volume_30d: '951575.24393951',
	//   best_bid: '16798.99',
	//   best_ask: '16799',
	//   side: 'sell',
	//   time: '2017-12-14T04:41:36.789000Z',
	//   trade_id: 28187314,
	//   last_size: '0.01900000' }

	var output = [
		{ 
			'Product': 'BTC-USD',
			'Price': Number(data['BTC-USD'].ticker.price),
			'Side': data['BTC-USD'].ticker.side,
			'low_24h': data['BTC-USD'].ticker.low_24h,
			'high_24h': data['BTC-USD'].ticker.high_24h,
			'best_bid': data['BTC-USD'].ticker.best_bid,
			'best_ask': data['BTC-USD'].ticker.best_ask,
			'bid_size': data['BTC-USD'].bids[0].size,
			'ask_size': data['BTC-USD'].asks[0].size
		},
		{ 
			'Product': 'LTC-USD',
			'Price': Number(data['LTC-USD'].ticker.price),
			'Side': data['LTC-USD'].ticker.side,
			'low_24h': data['LTC-USD'].ticker.low_24h,
			'high_24h': data['LTC-USD'].ticker.high_24h,
			'best_bid': data['LTC-USD'].ticker.best_bid,
			'best_ask': data['LTC-USD'].ticker.best_ask,
			'bid_size': data['LTC-USD'].bids[0].size,
			'ask_size': data['LTC-USD'].asks[0].size
		},
		{ 
			'Product': 'LTC-BTC',
			'Price': Number(data['LTC-BTC'].ticker.price),
			'Side': data['LTC-BTC'].ticker.side,
			'low_24h': data['LTC-BTC'].ticker.low_24h,
			'high_24h': data['LTC-BTC'].ticker.high_24h,
			'best_bid': data['LTC-BTC'].ticker.best_bid,
			'best_ask': data['LTC-BTC'].ticker.best_ask,
			// 'bid_size': data['LTC-BTC'].bids[0].size,
			// 'ask_size': data['LTC-BTC'].asks[0].size
		},
		{ 
			'Product': 'LTC-BTC*',
			'Price': (Number(data['LTC-USD'].ticker.price) / Number(data['BTC-USD'].ticker.price)),
			'bid_size': _.reduce(_.take(data['LTC-BTC'].bids, 3), (total, offer) => { return total + offer.price * offer.size }, 0),
			'ask_size': _.reduce(_.take(data['LTC-BTC'].asks, 3), (total, offer) => { return total + offer.price * offer.size }, 0)
		},
		{ 
			'Product': 'ETH-BTC',
			'Price': Number(data['ETH-BTC'].ticker.price),
			'Side': data['ETH-BTC'].ticker.side,
			'low_24h': data['ETH-BTC'].ticker.low_24h,
			'high_24h': data['ETH-BTC'].ticker.high_24h,
			'best_bid': data['ETH-BTC'].ticker.best_bid,
			'best_ask': data['ETH-BTC'].ticker.best_ask,
			// 'bid_size': data['ETH-BTC'].bids[0].size,
			// 'ask_size': data['ETH-BTC'].asks[0].size
		},
		{ 
			'Product': 'ETH-BTC*',
			'Price': (Number(data['ETH-USD'].ticker.price) / Number(data['BTC-USD'].ticker.price)),
			'bid_size': _.reduce(_.take(data['ETH-BTC'].bids, 3), (total, offer) => { return total + offer.price * offer.size }, 0),
			'ask_size': _.reduce(_.take(data['ETH-BTC'].asks, 3), (total, offer) => { return total + offer.price * offer.size }, 0)
		},
	];

	// console.log(columnify(output));
});


// strategies
/*
BUY LTC with BTC when BTC has breached resistance level before LTC does
BUY LTC with 

if LTC-BTC is low because BTC is high and LTC is low, then buy LTC
if LTC-BTC is low because both BTC and LTC is low, then hold.
ll
*/
