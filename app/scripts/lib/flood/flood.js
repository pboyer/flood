if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

if (typeof require != 'function' && typeof window != "object") { 

	var FLOOD = {};

}

define(function() {

	// initialize core types
	var FLOOD = FLOOD || {};

	FLOOD.baseTypes = {};
	FLOOD.nodeTypes = {};

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
		this.replication = "applyLongest";

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

		this.compile = function() { 
			
			var that = this;

			var partialEvalClosure = (function() { 

					// if we have enough args, eval, otherwise return function
					return function() {

						var dirty = that.isDirty();

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
						}
						// tell listeners that the evalation is complete
						that.evalComplete(that, arguments, dirty);

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


	// Add

	FLOOD.nodeTypes.Add = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [Number] ) ],
			typeName: "+" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a + b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Subtract

	FLOOD.nodeTypes.Sub = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [Number] ) ],
			typeName: "-" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a - b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Multiply

	FLOOD.nodeTypes.Mult = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [Number] ) ],
			typeName: "*" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a * b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Divide

	FLOOD.nodeTypes.Div = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [Number] ) ],
			typeName: "/" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a / b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Number

	FLOOD.nodeTypes.Number = function() {

		var typeData = {
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [Number] ) ],
			typeName: "Number" 
		};

		this.value = 0;

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.compile = this.printExpression = function(){
			return this.value;
		}

	}.inherits( FLOOD.baseTypes.NodeType );

	// Begin

	FLOOD.nodeTypes.Begin = function() {

		var typeData = {
			typeName: "begin" 
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "I", [AnyType], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [AnyType] ) ],
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
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [QuotedArray, Number] ) ],
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

	FLOOD.nodeTypes.Sort = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", [Function], function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [QuotedArray, AnyType] ) ],
			typeName: "Sort" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.sort(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Map = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", [Function], function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [QuotedArray, AnyType] ) ],
			typeName: "Map" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.map(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Reduce = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", [Function], function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] ), 
						new FLOOD.baseTypes.InputPort( "Acc", [AnyType], [] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [AnyType] ) ],
			typeName: "Reduce" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L, A) {

			return L.reduce(F, A);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Filter = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", [Function], function(a){ return a; } ),
									new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], [] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [AnyType] ) ],
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





