var Gdax = require('./gdax.js');
var tick = require('animation-loops');
var columnify = require('columnify');
var _ = require('lodash');
// formatting numbers: http://mathjs.org/docs/reference/functions/format.html

const products = ['BTC-USD', 'ETH-USD', 'ETH-BTC', 'LTC-USD', 'LTC-BTC'];
var gdax = new Gdax(products);

gdax.run();

var wallet = { 'LTC': 0, 'BTC': 0.16880029726516052 };
var action = 'buy';

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

	var output = [];
	_.each(products, product => {

		let bid_size = _.reduce(_.take(data[product].bids, 3), (total, offer) => { return total + offer.price * offer.size }, 0);
		let ask_size = _.reduce(_.take(data[product].asks, 3), (total, offer) => { return total + offer.price * offer.size }, 0);

		output.push({
			'Product': product,
			'Price': data[product].ticker.price,
			'Volume': data[product].ticker.volume,
			'Side': data[product].ticker.side,
			'low_24h': data[product].ticker.low_24h,
			'high_24h': data[product].ticker.high_24h,
			'best_bid': data[product].ticker.best_bid,
			'best_ask': data[product].ticker.best_ask,
			'bid_size': bid_size,
			'ask_size': ask_size,
			'bid-ask': bid_size / ask_size,
		});
	});

	output.push({ 
		'Product': 'LTC-BTC*',
		'Price': (Number(data['LTC-USD'].ticker.price) / Number(data['BTC-USD'].ticker.price)),
		// 'bid_size': _.reduce(_.take(data['LTC-BTC'].bids, 3), (total, offer) => { return total + offer.price * offer.size }, 0),
		// 'ask_size': _.reduce(_.take(data['LTC-BTC'].asks, 3), (total, offer) => { return total + offer.price * offer.size }, 0),
	});
	// output.push({ 
	// 	'Product': 'ETH-BTC*',
	// 	'Price': (Number(data['ETH-USD'].ticker.price) / Number(data['BTC-USD'].ticker.price)),
	// 	'bid_size': _.reduce(_.take(data['ETH-BTC'].bids, 3), (total, offer) => { return total + offer.price * offer.size }, 0),
	// 	'ask_size': _.reduce(_.take(data['ETH-BTC'].asks, 3), (total, offer) => { return total + offer.price * offer.size }, 0)
	// });

	var equiPrice = (Number(data['LTC-USD'].ticker.price) / Number(data['BTC-USD'].ticker.price));
	if((action == 'sell' || action == null) && data['LTC-BTC'].ticker.price > equiPrice && wallet.LTC > 0)
	{
		wallet.BTC = wallet.LTC * data['LTC-BTC'].ticker.price;
		console.log("SELL", wallet.LTC, "LTC @", data['LTC-BTC'].ticker.price, '=>', wallet.BTC);
		wallet.LTC = 0;
		action = 'buy';
		
		console.log(columnify([wallet]));
	}
	else if((action == 'buy' || action == null)  && data['LTC-BTC'].ticker.price < equiPrice && wallet.BTC > 0)
	{
		wallet.LTC = wallet.BTC / data['LTC-BTC'].ticker.price;
		console.log("BUY", wallet.LTC, "LTC @", data['LTC-BTC'].ticker.price, '<=', wallet.BTC);
		wallet.BTC = 0;
		action = 'sell';
		console.log(columnify([wallet]));
	}
	else
	{
		// console.log(_.take(data['LTC-BTC'].bids, 3));
		// console.log(columnify(output));
		// console.log(columnify([wallet]));
	}
});


// strategies
/*
BUY LTC with BTC when BTC has breached resistance level before LTC does
BUY LTC with 

if LTC-BTC is low because BTC is high and LTC is low, then buy LTC
if LTC-BTC is low because both BTC and LTC is low, then hold.
ll

When the bid volume is higher than the ask volume, the selling is stronger, and the price is likely to move lower.
When the ask volume is higher than the bid volume, the buying is stronger, and the price is likely to move higher.
*/


