var FLOOD = new require('./flood.js')
	, assert = require('assert')
	, scheme = require('./scheme.js');

;
// test case 1
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();
	var num5 = new FLOOD.nodeTypes.Num();
	num5.value = 5;
	var num2 = new FLOOD.nodeTypes.Num();
	num2.value = 2;

	add.inputs[0].connect( num5 );
	add.inputs[1].connect( num2 );

	assert.equal( add.printExpression() , '(+ 5 2)' );

	var S = new scheme.Interpreter();
	assert.equal( S.eval( add.compile() ) , 7 );

})(scheme, FLOOD);


// test case 2
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();
	var num5 = new FLOOD.nodeTypes.Num();
	num5.value = 5;

	var num2 = new FLOOD.nodeTypes.Num();
	num2.value = 2;

	add.inputs[0].connect( num5 );
	add.inputs[1].connect( num2 );

	var divide = new FLOOD.nodeTypes.Div();

	divide.inputs[0].connect( num5 );
	divide.inputs[1].connect( add );

	assert.equal( divide.printExpression() , '(/ 5 (+ 5 2))' );

	var S = new scheme.Interpreter();
	assert.equal( S.eval( divide.compile() ), 5/7);

})(scheme, FLOOD);


// test case 3
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();
	var num5 = new FLOOD.nodeTypes.Num();
	num5.value = 5;
	var num2 = new FLOOD.nodeTypes.Num();
	num2.value = 2;

	add.inputs[0].connect( num5 );
	add.inputs[1].connect( num2 );

	var divide = new FLOOD.nodeTypes.Div();

	divide.inputs[0].connect( num5 );
	divide.inputs[1].connect( add );

	var multiply = new FLOOD.nodeTypes.Mult();

	multiply.inputs[0].connect( num5 );
	multiply.inputs[1].connect( add );

	var begin = new FLOOD.nodeTypes.Begin();

	begin.inputs.push( multiply.outputs[0].asInputPort(begin, 0) );
	begin.inputs.push( divide.outputs[0].asInputPort(begin, 0) );

	begin.inputs[0].connect( multiply );
	begin.inputs[1].connect( divide );

	assert.equal( begin.printExpression(), '(begin (* 5 (+ 5 2)) (/ 5 (+ 5 2)))' );

	var S = new scheme.Interpreter();
	begin.markDirty();
	assert.equal( S.eval( begin.compile() ), 5/7);

})(scheme, FLOOD);

// test case 4, check that add if curried correctly
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();
	add.inputs[0].defaultVal = 1;
	add.inputs[1].useDefault = false;

	assert.equal( add.printExpression(), '(+ 1 _)' );

	var S = new scheme.Interpreter();
	add.markDirty();

	var add1 = S.eval( add.compile() );

	assert.equal( add1(6), 7);

})(scheme, FLOOD);

// test case 4, use a curried function with map
(function(scheme, FLOOD) {

	var num5 = new FLOOD.nodeTypes.Num();
	num5.value = 5;

	var add = new FLOOD.nodeTypes.Add();
	add.inputs[0].useDefault = false;

	add.inputs[1].connect( num5 );

	var map = new FLOOD.nodeTypes.Map();

	map.inputs[0].connect( add );
	map.inputs[1].defaultVal = ["quote", [0, 1, 2]];

	var S = new scheme.Interpreter();
	map.markDirty();

	var mapVal = S.eval( map.compile() );
	
	assert.equal( map.value.length, 3);
	assert.equal( map.value[0], 5);
	assert.equal( map.value[1], 6);
	assert.equal( map.value[2], 7);

})(scheme, FLOOD);



