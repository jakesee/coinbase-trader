var app = require('./app.js');


app.run((elapsed, delta, stop) => {
	// Rate-limiting is 10,000 per hour or 
	if(elapsed - lastTime >= 5000)
	{
		lastTime = elapsed;

		var promises = [

		];

		Promise.all(promises).then(values => {		

		}, failed => {

		});
	}
});