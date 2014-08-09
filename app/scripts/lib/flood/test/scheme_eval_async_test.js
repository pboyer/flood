var assert = require('assert')
	, async = require('../async.js')
	, scheme = require('../scheme.js');


(function(scheme) {

	var S = new scheme.Interpreter();

	S.eval_async( ["begin", 1, 2, 4], undefined, function(res){
		console.log(res);
	});

	S.eval_async( [function(x){ return x * 3; }, [ function(){ return 2; } ] ], undefined, function(res){
		console.log(res);
	});

	S.eval_async( [ "quote", "cool yo" ], undefined, function(res){
		console.log(res);
	});

	// allows interpreter execution to not block!

})(scheme);