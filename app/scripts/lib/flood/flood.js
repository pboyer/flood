if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

if (typeof require != 'function' && typeof window != "object") { 

	var FLOOD = {};
	var define = function(x, y){
		if (typeof x === "function") FLOOD = x();
		if (typeof y === "function") FLOOD = y();
	};

}

define(function() {

	// initialize core types
	if (!FLOOD) var FLOOD = {};

	FLOOD.baseTypes = {};
	FLOOD.nodeTypes = {};
	FLOOD.internalNodeTypes = {};

	if (typeof Object.create !== 'function') {
	    Object.create = function (o) {
	        function F() {}
	        F.prototype = o;
	        return new F();
	    };
	}

	// partial function application
	Function.prototype.curry = function() {
    var fn = this, args = Array.prototype.slice.call(arguments);

    return function() {
      return fn.apply(this, args.concat(
        Array.prototype.slice.call(arguments)));
    };
  };

  Function.prototype.partial = function(){
    var fn = this, args = Array.prototype.slice.call(arguments);
    return function(){
      var arg = 0;
      for ( var i = 0; i < args.length && arg < arguments.length; i++ )
        if ( args[i] === undefined )
          args[i] = arguments[arg++];
      return fn.apply(this, args);
    };
  };

	Array.prototype.remove = function(from, to) {
	  var rest = this.slice((to || from) + 1 || this.length);
	  this.length = from < 0 ? this.length + from : from;
	  return this.push.apply(this, rest);
	};

	Function.prototype.method = function (name, func) {
	    this.prototype[name] = func;
	    return this;
	};

	Function.method('inherits', function (parent) {
	    this.prototype = new parent();
	    var d = {}, 
	        p = this.prototype;
	    this.prototype.constructor = parent; 
	    return this;
	});

	// QuotedArray
	// ===========
	// QuotedArray is a slight modification of Array.  It makes it 
	// clear to the interpreter whether we're intending to pass
	// an expression Array or an Array as a value.  The interpreter checks
	// the constructor function in order to check the type.

	function QuotedArray(){
		Array.apply(this, arguments);
	};

	QuotedArray.prototype = new Array();
	QuotedArray.prototype.toString = function(){
		if (this.length === 0) return "[]";
		var eles = []; 
		for (var i = 0; i < this.length; i++){
			eles.push( this[i] );
		}
		return "[ " + eles.join(", ") + " ]"
	};

	QuotedArray.prototype.constructor = QuotedArray;
	FLOOD.QuotedArray = QuotedArray;

	// NodeType
	// ========

	FLOOD.baseTypes.NodeType = function(options) {

		var that = this;
		var options = options || {};
		this.replication = options.replication || "applyLongest";

		// tell the inputs about their parent node & index
		if (options.inputs) {
			options.inputs.forEach( function(e, i) {
				e.parentNode = that;
				e.parentIndex = i;
			});

			this.inputs = options.inputs;
		} else {
			this.inputs = [];
		}

		// tell the outputs about their parent node & index
		if (options.outputs) {
			options.outputs.forEach( function(e, i) {
				e.parentNode = that;
				e.parentIndex = i;
			});

			this.outputs = options.outputs;
		} else {
			this.outputs = [];
		}

		this.typeName = options.typeName || "noTypeName";

		var _isDirty = true;

		this.extend = function(args){

		}

		this.doPostProcess = true;

		this.isDirty = function() {
			return _isDirty;
		};

		this.markClean = function() {
			_isDirty = false;
		};

		this.setDirty = function() {
			_isDirty = true;
		};

		this.inputTypes = function(){
			return this.inputs.map(function(x){ return x.type; });
		}

		this.markDirty = function() {

			_isDirty = this.inputs.reduce(function(m, n){ 

				// there's nothing connected to this port
				if ( !n.oppNode ){
					return m;
				}

				return n.oppNode.markDirty() || m; 

			}, false) || _isDirty;

			// if (_isDirty) console.log(this.typeName + " is Dirty")

			return _isDirty;

		};

		this.printExpression = function() { 
			return "(" + this.typeName + " " + this.inputs.map(function(n){ return n.printExpression(); }).join(' ') + ")";					
		};

		this.addInputPort = function(name, type, defaultVal){
			this.inputs.push( new FLOOD.baseTypes.InputPort( name, type, defaultVal, this, this.inputs.length ) );
		}

		this.addOutputPort = function(name, type){
			this.outputs.push( new FLOOD.baseTypes.OutputPort( name, type, this, this.outputs.length ) );
		}

		this.evalComplete = function() {};
		this.evalFailed = function() {};
		this.evalBegin = function() {};

		this.compile = function() { 
			
			var that = this;

			var partialEvalClosure = (function() { 

					// if we have enough args, eval, otherwise return function
					return function() {

						var dirty = that.isDirty();

						try {

							that.evalBegin(that, dirty);

							if ( dirty ){

								// if any argument is undefined, perform partial function application
								var noUndefinedArgs = true;
								for (var i = 0; i < arguments.length; i++){
									if ( arguments[i] === undefined ){
										noUndefinedArgs = false;
										break;
									}
								}

								if (noUndefinedArgs){ 
									
									// build replication options and types
									var options = {
										replication: that.replication,
										expected_arg_types: that.inputTypes()
									};

									try {
										// actually evaluate the function!
										that.value = that.eval.mapApply(that, Array.prototype.slice.call(arguments, 0), options);
									} catch (e) {
										that.value = null;
										that.evalFailed(that, arguments);
									}

								} else { 
									// return a partial function application
									var originalArgs = arguments;
									that.value = (function(){
										// return a closure
										return function(){
											return that.eval.partial.apply(that.eval, originalArgs).apply(that, arguments);
										}
									})();
								}
								
								that.markClean();

								if ( that.doPostProcess && that.postProcess ){
									that.prettyValue = that.postProcess( that.value );
								}
							}

							// tell listeners that the evalation is complete
							that.evalComplete( that, arguments, dirty, that.value, that.prettyValue );

						} catch (e) {
							that.evalFailed(that, arguments, dirty, e);
							return null;
						}

						// yield the value
						return that.value;
					};

			})();

			// return an s-expression, represented by the function to execute, and the list
			// of arguments to apply to it
			return [partialEvalClosure].concat( this.inputs.map(function(input){
				return input.compile();
			}));
		
		};

	}

	// InputPort

	FLOOD.baseTypes.NodePort = function(name, type, parentNode, parentIndex, oppNode, oppIndex) {
		
		this.name = name;
		this.type = type;
		this.parentNode = parentNode;
		this.parentIndex = parentIndex != undefined ? parentIndex : 0;
		this.oppNode = oppNode;
		this.oppIndex = oppIndex != undefined ? oppIndex : 0;

	};

	FLOOD.baseTypes.OutputPort = function(name, type, parentNode, parentIndex, oppNode, oppIndex) {
		
		FLOOD.baseTypes.NodePort.call(this, name, type, parentNode, parentIndex, oppNode, oppIndex );

		this.value = function(){
			if ( !(this.parentNode.value instanceof Array) )
				return this.parentNode.value;
			return this.parentNode.value[this.parentIndex];
		};

		this.asInputPort = function(parentNode, parentIndex, defaultVal) {
			return new FLOOD.baseTypes.InputPort( this.name, this.type, defaultVal, parentNode, parentIndex );
		}

	}.inherits( FLOOD.baseTypes.NodePort );

	FLOOD.baseTypes.InputPort = function(name, type, defaultVal, parentNode, parentIndex, oppNode, oppIndex) {

		FLOOD.baseTypes.NodePort.call(this, name, type, parentNode, parentIndex, oppNode, oppIndex );
		this.defaultVal = defaultVal;
		this.useDefault = defaultVal === undefined ? false : true;

		this.printExpression = function() {
			if (this.oppNode && this.oppIndex === 0)
				return this.oppNode.printExpression();
			if (this.oppNode && this.oppIndex != 0)
				return '(pick ' + this.oppIndex + ' ' + this.oppNode.printExpression() + ')';
			if (this.useDefault === true )
				return this.defaultVal;
			return "_";
		}

		this.compile = function() {

			var val = null;

			if (this.oppNode && this.oppIndex === 0){
				val = this.oppNode.compile();
				return val;
			} else if (this.oppNode && this.oppIndex != 0){
				val = ['pick', this.oppIndex, this.oppNode.compile()];
				return val;
			} else if (this.useDefault === true) {
				val = this.defaultVal;
				return val;
			}

			// undefined value causes partial function application
			return undefined;
		}

		this.connect = function(otherNode, outIndexOnOtherNode){
			this.oppNode = otherNode;
			this.oppIndex = outIndexOnOtherNode != undefined ? outIndexOnOtherNode : 0;
			this.parentNode.setDirty();
		}

		this.disconnect = function(){
			this.oppNode = null;
			this.oppIndex = 0;
			this.parentNode.setDirty();
		}

	}.inherits( FLOOD.baseTypes.NodePort );

	// Number

	FLOOD.nodeTypes.Number = function() {

		var typeData = {
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Number" 
		};

		this.lastValue = 0;

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.printExpression = function(){
			return this.lastValue;
		};

		this.compile = function(){
			this.markClean();
			return this.lastValue;
		}

	}.inherits( FLOOD.baseTypes.NodeType );

	// Add

	FLOOD.nodeTypes.Add = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Add" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a + b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	// Subtract

	FLOOD.nodeTypes.Subtract = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Subtract" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a - b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Multiply

	FLOOD.nodeTypes.Multiply = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Multiply" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a * b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Divide

	FLOOD.nodeTypes.Divide = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Divide" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a / b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.GreaterThan = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
									new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Boolean] ) ],
			typeName: "GreaterThan" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a > b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Formula = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Formula" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.eval = function() {
			var _fa = Array.prototype.slice.call(arguments, 0);
			return eval( this.expression )
		};

		this.script = "A;";
		this.portNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

		this.extend = function(args){
			if (args.script && typeof args.script === "string")
				this.script = args.script;

			if (args.numInputs && typeof numInputs != "number" ){
				this.setNumInputs(args.numInputs);
			}

		}

		this.setNumInputs = function( numInputs ){

			if (typeof numInputs != "number" || numInputs < 0 || this.inputs.length === numInputs) {
				return compileExpression();
			}

			if (this.inputs.length < numInputs) addFormulaInput();
			if (this.inputs.length > numInputs) removeFormulaInput();

			this.setNumInputs( numInputs );
		}

		var that = this;

		var prefix = function(){

			var inputNames = that.inputs.map(function(x){
				return x.name;
			}).join(',');

			return '(function('+ inputNames + ') { return ';
		};

		var suffix = function(){

			var argNames = that.inputs.map(function(x,i){
				return "_fa[" + i + "]";
			}).join(',');

			return '}(' + argNames + '))';
		};

		var compileExpression = function(){
			that.expression = prefix() + that.script + suffix();
			return that.expression;
		};

		var addFormulaInput = function(){
			var port = new FLOOD.baseTypes.InputPort( that.portNames[ that.inputs.length ], [Number], 0 );
			port.parentNode = that;
			port.parentIndex = that.inputs.length;
			that.inputs.push( port );
		};

		var removeFormulaInput = function(){
			if (that.inputs.length === 0) return;
			that.inputs.pop();
		};

		compileExpression();

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.LessThan = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
									new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Boolean] ) ],
			typeName: "LessThan" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a < b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.LessThanOrEqual = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
									new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Boolean] ) ],
			typeName: "LessThanOrEqual" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a <= b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.GreaterThanOrEqual = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
									new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Boolean] ) ],
			typeName: "GreaterThanOrEqual" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a >= b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.Equal = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [AnyType], 0 ),
									new FLOOD.baseTypes.InputPort( "B", [AnyType], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Boolean] ) ],
			typeName: "Equal" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a === b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Begin

	FLOOD.internalNodeTypes.Begin = function() {

		var typeData = {
			typeName: "begin",
			isVisibleInLibrary: false
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.compile = function() {
			return [this.typeName].concat( this.inputs.map(function(input){
				return input.compile();
			}));
		}

	}.inherits( FLOOD.baseTypes.NodeType );

	// Watch

	FLOOD.nodeTypes.Watch = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Anything", [AnyType], null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "Watch" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.value = 0;

		this.eval = function(a) {
			return a;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Range

	FLOOD.nodeTypes.Range = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Min", [Number], 0.0 ),
									new FLOOD.baseTypes.InputPort( "Max", [Number], 1.0 ),
									new FLOOD.baseTypes.InputPort( "Steps", [Number], 10 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, Number] ) ],
			typeName: "Range" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(min, max, steps) {

			var range = new QuotedArray();

			if (min > max || steps <= 0){
				return range;
			}
			 
			var stepSize = (max - min) / steps;
			for (var i = 0; i < steps; i++){
				range.push(min + i * stepSize);
			}

			return range;

		};

	}.inherits( FLOOD.baseTypes.NodeType )


	FLOOD.nodeTypes.ListLast = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListLast" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(l) {
			return l[l.length-1];
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListFirst = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListFirst" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(l) {
			return l[0];
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListItemAtIndex = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] ),
									new FLOOD.baseTypes.InputPort( "Index", [Number] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListItemAtIndex" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(l, i) {
			return l[i];
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListByRepeat = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Value", [AnyType], 0 ),
									new FLOOD.baseTypes.InputPort( "Count", [Number], 0 )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "ListRepeat" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(v, t) {

			var a = new QuotedArray();

			if ( t > 0 ) for (var i = 0; i < t; i++) a.push(v);
			return a;

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListSort = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function], function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "ListSort" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.sort(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListMap = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function], function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "ListMap" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.map(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListReduce = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function], function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] ), 
						new FLOOD.baseTypes.InputPort( "Base", [AnyType], [] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListReduce" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L, A) {

			return L.reduce(F, A);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListFilter = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function], function(a){ return a; } ),
									new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "Filter" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(F, L) {

			return L.filter(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );


	// represents any type
	function AnyType() {};
	FLOOD.AnyType = AnyType;

	FLOOD.isObjectTypeMatch = isObjectTypeMatch;
	FLOOD.isFastTypeMatch = isFastTypeMatch;
	FLOOD.doAllTypesMatch = doAllTypesMatch;

	function isObjectTypeMatch(arg, arg_type) {

		if ( arg_type === undefined || arg_type === null){
			return true;
		}

		if (arg_type === AnyType){
			return true;
		}

		if ( arg === undefined || arg === null ){
			return false;
		}

		if (arg_type === AnyType && arg.constructor === QuotedArray ){
			return false;
		}

		return arg.constructor === arg_type || arg instanceof arg_type;

		// NOTE: instanceof will return FALSE for numbers
		// if they aren't created with new.  This behavior
		// sucks, so we use the constructor.

	};

  function isFastTypeMatch( arg, arg_type ){
	
	  // wrap with an arg array
		var wrap_arg = [ arg ];

		for (var j = 0; j < arg_type.length; j++){

			// "fast" means we only check the first element
			wrap_arg = wrap_arg[0];

			// check its type, return early on fail
			if ( !isObjectTypeMatch( wrap_arg, arg_type[j] ) ){
				return false;
			}
		}

		// all arg types are matched
		return true;

  };

  // first arg is the arguments to the node
  // second is the expected types
  function doAllTypesMatch( node_args, expected_arg_types ){

  	// if no supplied, just use default js dispatch
  	if ( !expected_arg_types ){
  		return true;
  	}

  	// if the Number of args and expected types don't match, return false
  	if (node_args.length != expected_arg_types.length){
  		return false;
  	}

  	// for each arg type, check match with expected input types
  	for (var i = 0; i < node_args.length; i++){
  		// do a fast type match
  		if ( !isFastTypeMatch(node_args[i], expected_arg_types[i]) ){
  			return false;
  		}
  	}

  	return true;
  }

  function allQuotedArrays( array ){

  	for (var i = 0; i < array.length; i++){
  		if ( !(array[i] instanceof QuotedArray) ){
  			return false;
  		}
  	}

  	return true;

  }

  function newNestedQuotedArrayByElements(eles){

  	var a = new QuotedArray();
  	for (var i = 0; i < eles.length; i++){
  		var b = new QuotedArray();
  		b.push(eles[i]);
  		a.push(b);
  	}

  	return a;

  }

  Function.prototype.applyCartesian = function( this_arg, args, options ){

  	// initialize the argument lists
  	var argmap = [];
  	if (args[0] instanceof Array){
  		args[0].map(function(x){
  			argmap.push([ x ]);
  		})
  	} else {
  		argmap.push( [ args[0] ] );
  	}

  	// for every arg position after first
  	for (var i = 1; i < args.length; i++){

  		var newmap = new QuotedArray();

  		// for every element in argmap
  		for (var j = 0; j < argmap.length; j++){

  			// if arg position is not an array, just push the element
  			if ( !(args[i] instanceof Array) ){
  				newmap.push( argmap[j].concat([ args[i] ]) );
  				continue;
  			}

  			// project each one of those previous elements as 
  			// many times as their are args in new position
  			for (var k = 0; k < args[i].length; k++){
  				newmap.push( argmap[j].concat( [ args[i][k] ] ) );
  			}

  		}

  		argmap = newmap;

  	}

  	var results = new QuotedArray();

  	for (var i = 0; i < argmap.length; i++){
  		results.push( this.mapApply( this_arg, argmap[i], options ) );
  	}
		
		return results;
  }

  Function.prototype.applyLongest = function( this_arg, args, options ){

	  // longest 
  	var length_array = args.map( function( a ){ 

  		if (a instanceof Array) {
  			return a.length;
  		} else {
  			return -1; // return -1 if arg is not an array
  		}

  	});

  	// get the longest list array
  	var max_length = Math.max.apply( Math, length_array );

  	var result = new QuotedArray();
  	for (var i = 0; i < max_length; i++){

  		var this_node_args = [];
  		for (var j = 0; j < args.length; j++){	
  			
  			var arg = args[j];
  			if ( arg instanceof QuotedArray){

  				// this may not be the longest, pick its length
  				var arg_max_length = Math.min(max_length, arg.length ) - 1;
  				this_node_args.push( args[j][ Math.min( i, arg_max_length )] );

  			} else {

  				this_node_args.push( arg );

  			}
  		}

  		result.push( this.mapApply(this_arg, this_node_args, options) );
  	}

  	return result;

  }

  Function.prototype.mapApply = function( this_arg, args, options ){

	  options = options || {};

	  // check if args matches types expected for node inputs - if so, execute
	  if ( doAllTypesMatch( args, options.expected_arg_types ) ){
	  	return this.apply(this_arg, args);
	  } 

	  var replicationType = options.replication || "applyLongest";

	  return this[ replicationType ](this_arg, args, options);

  }

	return FLOOD;

});






