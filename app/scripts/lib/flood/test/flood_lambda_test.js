var FLOOD = new require('../flood.js')
	, assert = require('assert')
	, scheme = require('../scheme.js');

(function(scheme, FLOOD) {

	var input0 = new FLOOD.nodeTypes.Input("A");
	var input1 = new FLOOD.nodeTypes.Input("B");
	var inputNodes = [input0, input1];

	var add = new FLOOD.nodeTypes.Add();
	add.inputs[0].connect( input0 );
	add.inputs[1].connect( input1 );

	var mult = new FLOOD.nodeTypes.Multiply();
	mult.inputs[0].connect( input0 );
	mult.inputs[1].connect( input1 );

	var output = new FLOOD.nodeTypes.Output("A");
	var output1 = new FLOOD.nodeTypes.Output("B");

	// compile this into a function
	output.inputs[0].connect( add );
	output1.inputs[0].connect( mult );

	// build the args list - this is basically a bunch of arg names
	var args = inputNodes.map(function(x){
		return x.compile();
	});

	// if there is more than one arg, the function returns a dict
	// otherwise it does nothing
	var box = function(){

		// take the args and place put them in an output
		// dictionary if necessary
		var args = Array.prototype.slice.call(arguments, 0);

		if (args.length === 1) return args[0];

		return new FLOOD.MultiOutResult(arguments);

	};

	var outputNodes = [output, output1];

	// ( lambda (a, b) (+ a b) )

	var res = [ "lambda", args, [ box ].concat( outputNodes.map( function(x){ return x.compile(); }) ) ];

	console.log( res );
	console.log( output.printExpression() );

	var S = new scheme.Interpreter();
	console.log( S.eval( [ res, 5, 7 ] ) );

})(scheme, FLOOD);