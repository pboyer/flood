var FLOOD = new require('./flood.js')
	, assert = require('assert')
	, scheme = require('./scheme.js');

// mapApply - applyCartesian without nesting
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();

	// expected_arg_types
	var options = {};
	options.expected_arg_types = [[Number], [Number]];
	options.replication = "applyCartesian";

	var arr0 = new FLOOD.QuotedArray();
	arr0.push(-10);
	arr0.push(2);

	var arr1 = new FLOOD.QuotedArray();
	arr1.push(2);
	arr1.push(3);	

	var res = add.eval.mapApply(add.eval, [arr0, arr1], options);
	assert.equal( 4, res.length );
	assert.equal( "[ -8, -7, 4, 5 ]", res.toString() );

	var res = add.eval.mapApply(add.eval, [arr0, 1], options);
	assert.equal( 2, res.length );
	assert.equal( "[ -9, 3 ]", res.toString() );

	var res = add.eval.mapApply(add.eval, [1, 1], options);
	assert.equal( "2", res.toString() );

	var res = add.eval.mapApply(add.eval, [1, arr1], options);
	assert.equal( 2, res.length );
	assert.equal( "[ 3, 4 ]", res.toString() );

})(scheme, FLOOD);

// mapApply - applyLongest with nesting
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();

	// expected_arg_types
	var options = {};
	options.expected_arg_types = [[Number], [Number]];
	options.replication = "applyLongest";

	var arrA = new FLOOD.QuotedArray();
	var arr0 = new FLOOD.QuotedArray();
	arrA.push(arr0);
	arr0.push(1);

	var arrB = new FLOOD.QuotedArray();
	var arr1 = new FLOOD.QuotedArray();
	arrB.push(arr1);
	arr1.push(2);

	var res = add.eval.mapApply(eval, [arrA, arrB], options);

	assert.equal( 1, res.length );
	assert.equal( "[ [ 3 ] ]", res.toString() );

	var res = add.eval.mapApply(eval, [4, arrB], options);

	assert.equal( 1, res.length );
	assert.equal( "[ [ 6 ] ]", res.toString() );

	var res = add.eval.mapApply(eval, [arrA, 2], options);

	assert.equal( 1, res.length );
	assert.equal( "[ [ 3 ] ]", res.toString() );

	arr0.push(2);
	var res = add.eval.mapApply(eval, [arrA, 2], options);

	assert.equal( 1, res.length );
	assert.equal( "[ [ 3, 4 ] ]", res.toString() );

	var res = add.eval.mapApply(eval, [arrA, arrA], options);

	assert.equal( 1, res.length );
	assert.equal( "[ [ 2, 4 ] ]", res.toString() );

})(scheme, FLOOD);

// mapApply - applyLongest without nesting
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();

	// expected_arg_types
	var options = {};
	options.expected_arg_types = [[Number], [Number]];
	options.replication = "applyLongest";

	var arr = new FLOOD.QuotedArray();
	arr.push(8);
	arr.push(9);
	arr.push(10);

	var res = add.eval.mapApply(eval, [1, arr], options);
	assert.equal( 3, res.length );
	assert.equal( "[ 9, 10, 11 ]", res.toString() );

	var res = add.eval.mapApply(eval, [arr, arr], options);
	assert.equal( 3, res.length );
	assert.equal( "[ 16, 18, 20 ]", res.toString() );

	arr.push(11);

	var res = add.eval.mapApply(eval, [1, arr], options);
	assert.equal( 4, res.length );
	assert.equal( "[ 9, 10, 11, 12 ]", res.toString() );

})(scheme, FLOOD);

// doAllTypesMatch
(function(scheme, FLOOD) {

	var arg = [null], arg_type = [[ FLOOD.AnyType ]];
	assert.equal( true, FLOOD.doAllTypesMatch( arg, arg_type ) );

	var arg = [8], arg_type = [[ Number ]];
	assert.equal( true, FLOOD.doAllTypesMatch( arg, arg_type ) );

	var arrNum = new FLOOD.QuotedArray();
	arrNum.push(8);
	var arg = [ 8, arrNum ], arg_type = [[ Number ], [ FLOOD.QuotedArray, Number ]];
	assert.equal( true, FLOOD.doAllTypesMatch( arg, arg_type ) );

	var arrString = new FLOOD.QuotedArray();
	arrString.push("frog");
	var arg = [ 8, arrNum, arrString ], arg_type = [ [ Number ], [ FLOOD.QuotedArray, Number ], [ FLOOD.QuotedArray, String ] ];
	assert.equal( true, FLOOD.doAllTypesMatch( arg, arg_type ) );

	var arg = [ 8, arrString, arrNum ], arg_type = [ [ Number ], [ FLOOD.QuotedArray, Number ], [ FLOOD.QuotedArray, String ] ];
	assert.equal( false, FLOOD.doAllTypesMatch( arg, arg_type ) );

})(scheme, FLOOD);

// isFastTypeMatch
(function(scheme, FLOOD) {

	var arg = null, arg_type = [ FLOOD.AnyType ];
	assert.equal( true, FLOOD.isFastTypeMatch(arg, arg_type) );

	var arg = new FLOOD.QuotedArray(null), arg_type = [ FLOOD.QuotedArray, FLOOD.AnyType ];
	assert.equal( true, FLOOD.isFastTypeMatch(arg, arg_type) );

	var arg = null, arg_type = [ FLOOD.QuotedArray, FLOOD.AnyType ];
	assert.equal( false, FLOOD.isFastTypeMatch(arg, arg_type) );

	var arg = new FLOOD.QuotedArray(), arg_type = [ FLOOD.QuotedArray, Number ];
	arg.push(8);
	assert.equal( true, FLOOD.isFastTypeMatch(arg, arg_type) );

	var arg = new FLOOD.QuotedArray(), arg_type = [ FLOOD.QuotedArray, FLOOD.QuotedArray, Number ];
	arg.push("peter");
	arg.push(8);
	assert.equal( false, FLOOD.isFastTypeMatch(arg, arg_type) );

	var arg = [[8, 8]], arg_type = [Array, Array, Number];
	assert.equal( true, FLOOD.isFastTypeMatch(arg, arg_type) );

	var arg = [[[8]]], arg_type = [Array, Array, Array, Number];
	assert.equal( true, FLOOD.isFastTypeMatch(arg, arg_type) );

	// new constructor function
	function Turtle(){};
	var arg = [[[new Turtle()]]], arg_type = [Array, Array, Array, Turtle];
	assert.equal( true, FLOOD.isFastTypeMatch(arg, arg_type) );

})(scheme, FLOOD);

// isObjectTypeMatch
(function(scheme, FLOOD) {

	var arg = null, arg_type = FLOOD.AnyType;
	assert.equal( true, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = 8, arg_type = Number;
	assert.equal( true, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = -8.23, arg_type = Number;
	assert.equal( true, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = "peter", arg_type = String;
	assert.equal( true, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = new FLOOD.QuotedArray(), arg_type = FLOOD.QuotedArray;
	assert.equal( true, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = [], arg_type = Number;
	assert.equal( false, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = "peter", arg_type = Number;
	assert.equal( false, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = function(){}, arg_type = Function;
	assert.equal( true, FLOOD.isObjectTypeMatch(arg, arg_type) );

	var arg = function(){}, arg_type = Number;
	assert.equal( false, FLOOD.isObjectTypeMatch(arg, arg_type) );

})(scheme, FLOOD);


// test case 1
(function(scheme, FLOOD) {

	var add = new FLOOD.nodeTypes.Add();
	var num5 = new FLOOD.nodeTypes.Number();
	num5.value = 5;
	var num2 = new FLOOD.nodeTypes.Number();
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
	var num5 = new FLOOD.nodeTypes.Number();
	num5.value = 5;

	var num2 = new FLOOD.nodeTypes.Number();
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
	var num5 = new FLOOD.nodeTypes.Number();
	num5.value = 5;
	var num2 = new FLOOD.nodeTypes.Number();
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

// // test case 4, check that add if curried correctly
// (function(scheme, FLOOD) {

// 	var add = new FLOOD.nodeTypes.Add();
// 	add.inputs[0].defaultVal = 1;
// 	add.inputs[1].useDefault = false;

// 	assert.equal( add.printExpression(), '(+ 1 _)' );

// 	var S = new scheme.Interpreter();
// 	add.markDirty();

// 	var add1 = S.eval( add.compile() );

// 	assert.equal( add1(6), 7);

// })(scheme, FLOOD);

// // test case 4, use a curried function with map
// (function(scheme, FLOOD) {

// 	var num5 = new FLOOD.nodeTypes.Num();
// 	num5.value = 5;

// 	var add = new FLOOD.nodeTypes.Add();
// 	add.inputs[0].useDefault = false;

// 	add.inputs[1].connect( num5 );

// 	var map = new FLOOD.nodeTypes.Map();

// 	map.inputs[0].connect( add );
// 	map.inputs[1].defaultVal = ["quote", [0, 1, 2]];

// 	var S = new scheme.Interpreter();
// 	map.markDirty();

// 	var mapVal = S.eval( map.compile() );
	
// 	assert.equal( map.value.length, 3);
// 	assert.equal( map.value[0], 5);
// 	assert.equal( map.value[1], 6);
// 	assert.equal( map.value[2], 7);

// })(scheme, FLOOD);



