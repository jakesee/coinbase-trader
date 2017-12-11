const tick = require('animation-loops');
const readline = require('readline');

const r1 = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

lastTime = 0;
var handle = tick.add(function(elasped, delta, stop) {
	if(elasped - lastTime > 1000)
	{
		lastTime = elasped;
		console.log(Date.now());
	}
});

r1.question("Do you want to buy? (Y/N)", (answer) => {
	if(answer.match(/^y(es)?$/i))
		console.log('YEA!');
	else
		console.log('errr...');

	r1.close();
});
