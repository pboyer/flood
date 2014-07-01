var FLOOD = new require('../flood.js')
	, assert = require('assert')
	, scheme = require('../scheme.js');


(function(scheme, FLOOD) {

	var nodes = [];

	var input0 = new FLOOD.nodeTypes.Input("A");
	var input1 = new FLOOD.nodeTypes.Input("B");
	
	nodes.push(input0);
	nodes.push(input1);

	var add = new FLOOD.nodeTypes.Add();
	nodes.push(add);

	add.inputs[0].connect( input0 );
	add.inputs[1].connect( input1 );

	var mult = new FLOOD.nodeTypes.Multiply();
	nodes.push(mult);

	mult.inputs[0].connect( input0 );
	mult.inputs[1].connect( input1 );

	var output = new FLOOD.nodeTypes.Output("A");
	var output1 = new FLOOD.nodeTypes.Output("B");
	nodes.push(output);
	nodes.push(output1);

	// compile this into a function
	output.inputs[0].connect( add );
	output1.inputs[0].connect( mult );

	var lambda = FLOOD.compileNodesToLambda( nodes );

	var S = new scheme.Interpreter();

	var eres = S.eval( [ lambda, 5, 7 ] );

	assert.equal( eres[0], 12 );
	assert.equal( eres[1], 35 );

})(scheme, FLOOD);