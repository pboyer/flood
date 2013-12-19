if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function() {

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

  // provides recursive replication behavior for array style args
  Function.prototype.mapApply = function( this_arg, orig_arg_array, options ){

  	// based on the properties of the individual input ports, provide 
  	// the appropriate replication

  	var arg_array = Array.prototype.slice.call(orig_arg_array, 0);

  	// get the longest array
  	var length_array = arg_array.map( function( a ){ 
  		if (a instanceof Array) {
  			return a.length;
  		} else {
  			return -1; // return -1 if arg is not an array
  		}
  	});

  	// get the longest list array
  	var max_length = Math.max.apply( Math, length_array );

  	// if no arrays, just return normal application
  	if (max_length === -1){
  		return this.apply(this_arg, arg_array);
  	}

  	// otherwise, apply recursive 'longest' mapping operation
  	var result = [];
  	for (var i = 0; i < max_length; i++){

  		var this_arg_array = [];
  		for (var j = 0; j < arg_array.length; j++){	
  			
  			var arg = arg_array[j];
  			if ( arg instanceof Array){

  				// this may not be the longest, pick its length
  				var arg_max_length = Math.min(max_length, arg.length ) - 1;
  				this_arg_array.push( arg_array[j][ Math.min( i, arg_max_length )] );

  			} else {

  				this_arg_array.push( arg );

  			}
  		}

  		result.push( this.mapApply(this_arg, this_arg_array) );
  	}

  	return result;

  }

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


	// initialize core types

	var FLOOD = FLOOD || {};

	FLOOD.baseTypes = {};
	FLOOD.nodeTypes = {};

	// NodeType

	FLOOD.baseTypes.NodeType = function(options) {

		var that = this;
		var options = options || {};

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

		this.compile = function() { 
			
			var that = this;

			var partialEvalClosure = (function() { 

					// if we have enough args, eval, otherwise return function
					return function() {
						if ( that.isDirty() ){

							// if any argument is undefined, perform partial function application
							var noUndefinedArgs = true;
							for (var i = 0; i < arguments.length; i++){
								if ( arguments[i] === undefined ){
									noUndefinedArgs = false;
									break;
								}
							}

							// actually evaluate the function
							if (noUndefinedArgs){ 
								that.value = that.eval.mapApply(that, arguments);
							// return a partial function application
							} else { 

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
						that.evalComplete(that, arguments);

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

	FLOOD.baseTypes.List = function(){
		this.List = [];
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
			// quote list input
			var quote = this.type.indexOf("list") != -1 ? "quote" : null
				, val = null;

			if (this.oppNode && this.oppIndex === 0){
				val = this.oppNode.compile();
				return quote ? [quote, val] : val;
			} else if (this.oppNode && this.oppIndex != 0){
				val = ['pick', this.oppIndex, this.oppNode.compile()];
				return quote ? [quote, val] : val;
			} else if (this.useDefault === true) {
				val = this.defaultVal;
				return quote ? [quote, val] : val;
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", "number", 0 ),
						new FLOOD.baseTypes.InputPort( "B", "number", 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "number" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", "number", 0 ),
						new FLOOD.baseTypes.InputPort( "B", "number", 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "number" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", "number", 0 ),
						new FLOOD.baseTypes.InputPort( "B", "number", 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "number" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", "number", 0 ),
						new FLOOD.baseTypes.InputPort( "B", "number", 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "number" ) ],
			typeName: "/" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a / b;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	// Number

	FLOOD.nodeTypes.Num = function() {

		var typeData = {
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "number" ) ],
			typeName: "number" 
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "I", "any", 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "any" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Min", "number", 0.0 ),
									new FLOOD.baseTypes.InputPort( "Max", "number", 1.0 ),
									new FLOOD.baseTypes.InputPort( "Steps", "number", 10 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "number" ) ],
			typeName: "Range" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(min, max, steps) {

			var range = [];

			if (min > max || steps <= 0){
				return range;
			}
			 
			var stepSize = (max - min) / steps;
			for (var i = 0; i < steps; i++){
				range.push(i * stepSize);
			}

			return range;

		};

	}.inherits( FLOOD.baseTypes.NodeType )

	FLOOD.nodeTypes.Sort = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", "function", function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", "list:t", [] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "list:t" ) ],
			typeName: "Sort" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.sort(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Map = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", "function", function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", "list:t", [] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "list:t" ) ],
			typeName: "Map" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.map(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Reduce = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", "function", function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", "list:t", [] ), 
						new FLOOD.baseTypes.InputPort( "Acc", "t", [] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "t" ) ],
			typeName: "Reduce" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L, A) {

			return L.reduce(F, A);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Filter = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Func", "function", function(a){ return a; } ),
									new FLOOD.baseTypes.InputPort( "List", "list:t", [] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "t" ) ],
			typeName: "Filter" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(F, L) {

			return L.filter(F);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	return FLOOD;


});





