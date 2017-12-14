var Gdax = require('./gdax.js');
var tick = require('animation-loops');
var columnify = require('columnify');
// formatting numbers: http://mathjs.org/docs/reference/functions/format.html

var gdax = new Gdax(['BTC-USD', 'LTC-USD', 'LTC-BTC']);

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
			'Price': Number(data.ticker['BTC-USD'].price),
			'Side': data.ticker['BTC-USD'].side,
			'low_24h': data.ticker['BTC-USD'].low_24h,
			'high_24h': data.ticker['BTC-USD'].high_24h,
			'best_bid': data.ticker['BTC-USD'].best_bid,
			'best_ask': data.ticker['BTC-USD'].best_ask,
			'bid_size': data.bids[Number(data.ticker['BTC-USD'].best_bid)] == undefined ? 0 : data.bids[Number(data.ticker['BTC-USD'].best_bid)].size,
			'ask_size': data.asks[Number(data.ticker['BTC-USD'].best_ask)] == undefined ? 0 : data.asks[Number(data.ticker['BTC-USD'].best_ask)].size,
		},
		{ 
			'Product': 'LTC-USD',
			'Price': Number(data.ticker['LTC-USD'].price),
			'Side': data.ticker['LTC-USD'].side,
			'low_24h': data.ticker['LTC-USD'].low_24h,
			'high_24h': data.ticker['LTC-USD'].high_24h,
			'best_bid': data.ticker['LTC-USD'].best_bid,
			'best_ask': data.ticker['LTC-USD'].best_ask,
		},
		{ 
			'Product': 'LTC-BTC',
			'Price': Number(data.ticker['LTC-BTC'].price),
			'Side': data.ticker['LTC-BTC'].side,
			'low_24h': data.ticker['LTC-BTC'].low_24h,
			'high_24h': data.ticker['LTC-BTC'].high_24h,
			'best_bid': data.ticker['LTC-BTC'].best_bid,
			'best_ask': data.ticker['LTC-BTC'].best_ask,
		},
		{ 
			'Product': 'LTC-BTC*',
			'Price': (Number(data.ticker['LTC-USD'].price) / Number(data.ticker['BTC-USD'].price)),
		},
	]
	console.log(columnify(output));
});
