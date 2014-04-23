
var src = "flood_runner.js";
var runner = new Worker(src);
var running = false;

onmessage = function (m) {

	if (m.data.kind === "cancel") {
		cancel( m.data );
	}

	runner.postMessage(m);

};

var cancel = function(d){

	if (running) {
		runner.terminate();
		runner = new Worker(src);
	}

	postMessage({ kind: "cancelled"});

};

// get ast
// execute

