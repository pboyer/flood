if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

// Webworker context
if (typeof require != 'function' && typeof window != "object") { 

	var FLOOD = {};
	var define = function(x, y){
		if (typeof x === "function") FLOOD = x();
		if (typeof y === "function") FLOOD = y();
	};

}

define('FLOOD',function() {

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

	Array.prototype.last = function() {
	    return this[this.length-1];
	}

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

	// MultiOutResult
	// ===========
	//

	function MultiOutResult(object){
		for (var i in object){
			this[i] = object[i];
		}
	};
	MultiOutResult.prototype = new Object();

	MultiOutResult.wrap = function(){

		if (arguments.length === 0) return undefined;

		return arguments.length === 1 ? arguments[0] : 
			new FLOOD.MultiOutResult( arguments );

	};

	MultiOutResult.prototype.constructor = MultiOutResult;
	FLOOD.MultiOutResult = MultiOutResult;

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

	Array.prototype.flatten = function(){

		if (this.length === 0) return [];

		if ( isObjectTypeMatch( this[0], Array) ){
			return this[0].flatten().concat( this.slice(1).flatten() );
		} 

		return [ this[0] ].concat( this.slice(1).flatten() );
	};

	Array.prototype.toQuotedArray = function(){

		var qa = new QuotedArray();
		for (var i = 0; i < this.length; i++){
			qa.push( this[i].toQuotedArray ? this[i].toQuotedArray() : this[i] );
		}
		return qa;
	};

	QuotedArray.prototype.constructor = QuotedArray;
	FLOOD.QuotedArray = QuotedArray;

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

		this.alwaysDirty = false;
		this.doPostProcess = true;

		this.isDirty = function() {
			return this.alwaysDirty ? true : _isDirty;
		};

		this.markClean = function() {
			_isDirty = false;
		};

		this.setDirty = function() {
			_isDirty = true;
		};

		this.inputTypes = function(){
			return this.inputs.map(function(x){ return x.type; });
		};

		this.getIndexOfInputNode = function( otherNode ){
			for (var i = 0; i < this.inputs.length; i++){
				if ( this.inputs[i].isConnectedTo( otherNode ) ) return i;
			}

			return -1;
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
										that.evalFailed(that, e);
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
							that.evalFailed(that, e);
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

	FLOOD.baseTypes.NodePort = function(name, type, parentNode, parentIndex, oppNode, oppIndex) {
		
		function constructPortTypeName(type) { 
			if (!type) return;
			if (type instanceof Array) return type.map( constructPortTypeName ).join(" of ");
			if (type.floodTypeName) return type.floodTypeName;

			var funcNameRegex = /function (.{1,})\(/;
			var results = (funcNameRegex).exec(type.toString());
			return (results && results.length > 1) ? results[1] : "";
		};

		this.name = name;
		this.type = type;
		this.typeName = constructPortTypeName( type );
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
			if (this.oppNode && this.oppIndex === 0 && this.oppNode.outputs.length === 1)
				return this.oppNode.printExpression();
			if (this.oppNode)
				return '(pick ' + this.oppIndex + ' ' + this.oppNode.printExpression() + ')';
			if (this.useDefault === true )
				return this.defaultVal;
			return "_";
		}

		var autoPick = function(name, x){

			if ( isObjectTypeMatch(x, QuotedArray) ){
				return x.map( autoPick.curry( name ) );
			} else if ( isObjectTypeMatch(x, MultiOutResult ) ){
				return x[name] != undefined ? x[name] : null;
			}

			return null;
		};

		this.compile = function() {

			var val = null;

			if (this.oppNode && this.oppIndex === 0 && this.oppNode.outputs.length === 1){
				val = this.oppNode.compile();
				return val;
			} else if (this.oppNode){
				val = [ autoPick, this.oppIndex, this.oppNode.compile() ];
				return val;
			} else if (this.useDefault === true) {
				val = this.defaultVal;
				return val;
			}

			// undefined value causes partial function application
			return undefined;
		}

		this.isConnectedTo = function( otherNode ){
			return this.oppNode === otherNode;
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

	FLOOD.internalNodeTypes.CustomNode = function(functionName, functionId, lambda) {

		var typeData = {
			typeName: "CustomNode"
		};

		this.functionName = functionName;
		this.functionId = functionId;
		this.lambda = lambda;

		if (scheme) var S = new scheme.Interpreter();

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function() {

			this.lambda = FLOOD.environment[this.functionId];

			if ( !this.lambda ) throw new Error("The custom node is not yet compiled.");

			var args = Array.prototype.slice.call(arguments, 0);
			var exp = [ this.lambda ].concat(args) ;

			return S.eval( exp );

		};

		this.printExpression = function() { 
			return "(" + this.functionName + " " + this.inputs.map(function(n){ return n.printExpression(); }).join(' ') + ")";					
		};

		this.extend = function(args){

			if (args.functionName && typeof args.functionName === "string"){
				this.functionName = args.functionName;
			}

			if (args.functionId && typeof args.functionId === "string"){
				this.functionId = args.functionId;
			}

			if (args.numInputs && typeof args.numInputs === "number" ){
				this.setNumInputs(args.numInputs);
			}

			if (args.numOutputs && typeof args.numOutputs === "number" ){
				this.setNumOutputs(args.numOutputs);
			}

		};

		var that = this;


		this.setInputTypes = function( inputTypes ){

			for (var i = 0; i < this.inputs.length; i++) 
				this.inputs[i].type = inputTypes[i];

		};

		this.setNumInputs = function( num ){

			if (typeof num != "number" || num < 0 || this.inputs.length === num) {
				return;
			}

			if (this.inputs.length < num) addInput();
			if (this.inputs.length > num) removeInput();

			this.setNumInputs( num );
		};

		this.setNumOutputs = function( num ){

			if (typeof num != "number" || num < 0 || this.outputs.length === num) {
				return;
			}

			if (this.outputs.length < num) addOutput();
			if (this.outputs.length > num) removeOutput();

			this.setNumOutputs( num );
		};

		var addInput = function(){
			var port = new FLOOD.baseTypes.InputPort( characters[ that.inputs.length ], [AnyTypeButQuotedArray], 0 );
			port.parentNode = that;
			port.parentIndex = that.inputs.length;
			that.inputs.push( port );
		};

		var removeInput = function(){
			if (that.inputs.length === 0) return;
			that.inputs.pop();
		};

		var addOutput = function(){
			var port = new FLOOD.baseTypes.OutputPort( characters[ that.outputs.length ], [AnyType] );
			port.parentNode = that;
			port.parentIndex = that.outputs.length;
			that.outputs.push( port );
		};

		var removeOutput = function(){
			if (that.outputs.length === 0) return;
			that.outputs.pop();
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.internalNodeTypes.CustomNode.nodesOfType = function(type, nodes){

		return nodes.filter(function(x){
			return x instanceof type;
		});
	};

	FLOOD.internalNodeTypes.CustomNode.findInputTypes = function(nodes){

		var inputNodes = FLOOD.internalNodeTypes.CustomNode.nodesOfType( FLOOD.nodeTypes.Input, nodes );

		return inputNodes.map(function(inode, index){

			// get all of the types for all connections to this one
			var allPotentialTypes = nodes.reduce(function(agg, node){

				var con = node.getIndexOfInputNode( inode );
				if (con < 0) return agg;

				agg.push( node.inputs[con].type );
				return agg;

			}, []);
			
			// check if input port is not connected - if so, short-circuit
			if (allPotentialTypes.length === 0) return AnyTypeButQuotedArray;

			// each type is an array - the last position is the concrete type
			var typeToMatch = allPotentialTypes[0];
			var firstConcreteType = typeToMatch.last();

			// assert all types match
			allPotentialTypes.map(function(t){
				return t.last();
			}).forEach(function(t){

				if ( t === firstConcreteType ||
						 t === AnyType ||
						 t === AnyTypeButQuotedArray ) return;

				throw new TypeError("One of the inputs is connected to multiple nodes with incompatible types!")

			});

			// get the most complex type, this is simply the longest array
			var maxLen = 0;
			var idMax = -1;
			for (var i = allPotentialTypes.length - 1; i >= 0; i--) {
				if ( allPotentialTypes[i].length > maxLen ) {
					idMax = i;
					maxLen = allPotentialTypes[i].length;
				} 
			};

			return allPotentialTypes[maxLen];

		});
	};

	FLOOD.internalNodeTypes.CustomNode.compileNodesToLambda = function(nodes){

		// find all input nodes
		var inputNodes = nodes.filter(function(x){
			return x instanceof FLOOD.nodeTypes.Input;
		});

		// find all output nodes
		var outputNodes = nodes.filter(function(x){
			return x instanceof FLOOD.nodeTypes.Output;
		});

		// compile the input nodes, forming the arg list
		var args = inputNodes.map(function(x){
			return x.compile();
		});

		// compile the output nodes, forming the internal value expressions
		var internalExp = outputNodes.map( function(x){ return x.compile(); });

		// we need a function to box up the internal expression
		// in a dictionary if there are multiple outputs
		var boxedExp = internalExp.length > 1 ? 
			[ FLOOD.MultiOutResult.wrap ].concat( internalExp ) : internalExp[0];

		// nodes in a custom node do not cache their value
		nodes.forEach(function(x){ x.alwaysDirty = true; });

		// ( lambda (args) boxedExp )
		return ["lambda", args, boxedExp];
	};

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

		this.extend = function(args){

			if (args.value != undefined && typeof args.value === "number"){
				this.lastValue = args.value;
			} else {
				this.lastValue = 0;
			}
	
		}

	}.inherits( FLOOD.baseTypes.NodeType );

	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	var currentInputChar = 0;

	FLOOD.nodeTypes.Script = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [AnyTypeButQuotedArray], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "Script" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData);

		// for formula implementers convenience
		var Sin = Math.sin, Cos = Math.cos, Abs = Math.abs, Tan = Math.tan, Random = Math.random,
			Asin = Math.asin, Atan = Math.atan, Acos = Math.acos, Exp = Math.exp, Sqrt = Math.sqrt,
			Pow = Math.pow, Pi = Math.PI, Eval = eval;

		this.eval = function() {
			var _fa = Array.prototype.slice.call(arguments, 0);
			var val = eval( this.expression );

			// if array value, quote it
			if (val instanceof Array) return val.toQuotedArray();
			return val;
		};

		this.script = "A;";
		this.portNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

		this.extend = function(args){

			if (args.script && typeof args.script === "string"){
				this.script = args.script;
				compileExpression();
			}

			if (args.numInputs && typeof args.numInputs === "number" ){
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
			var port = new FLOOD.baseTypes.InputPort( that.portNames[ that.inputs.length ], [AnyTypeButQuotedArray], 0 );
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

	FLOOD.nodeTypes.Pi = function() {

		var typeData = {
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Pi" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.eval = function(){
			return Math.PI;
		}

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Print = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Anything", [AnyType], null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "Print" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.value = 0;

		this.eval = function(a) {
			return a;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

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

	FLOOD.nodeTypes.Negate = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [Number], 1 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "Negate" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a) {
			return -1 * a;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Equal = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [AnyTypeButQuotedArray], 0 ),
									new FLOOD.baseTypes.InputPort( "B", [AnyTypeButQuotedArray], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Boolean] ) ],
			typeName: "Equal" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a === b;
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

	FLOOD.nodeTypes.Input = function(name) {

		var typeData = {
			typeName: "Input",
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyTypeButQuotedArray] ) ],
		};

		if (name === undefined) name = characters[currentInputChar++];

		this.name = name;

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.compile = function() {
			return this.name;
		}

		this.printExpression = function(){
			return this.name;
		}

	}.inherits( FLOOD.baseTypes.NodeType );

	var currentOutputChar = 0;

	FLOOD.nodeTypes.Output = function(name) {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "⇒", [AnyType] ) ],
			typeName: "Output"
		};

		if (name === undefined) name = characters[currentOutputChar++];

		this.name = name;

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.compile = function() {
			return this.inputs[0].compile();
		}

	}.inherits( FLOOD.baseTypes.NodeType );

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

			if (min > max) throw new Error('Max must be greater than Min!');
			if (steps <= 0) throw new Error('The Steps must be greater than 0.');
			if (min === max) throw new Error('Min is equal to Max!');

			var range = new QuotedArray();

			if (steps > 1){
				var stepSize = (max - min) / (steps-1);
				for (var i = 0; i < steps-1; i++){
					range.push(min + i * stepSize);
				}
			}

			range.push(max);

			return range;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Steps = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Min", [Number], 0.0 ),
									new FLOOD.baseTypes.InputPort( "Max", [Number], 1.0 ),
									new FLOOD.baseTypes.InputPort( "StepSize", [Number], 0.1 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, Number] ) ],
			typeName: "Steps" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(min, max, stepSize) {

			if (min > max) throw new Error('Max must be greater than Min!');
			if (stepSize <= 1e-6 ) throw new Error('The StepSize is less than 0.');
			if (min === max) throw new Error('Min is equal to Max!');

			var range = new QuotedArray();


			var step = min;

			while (step <= max){
				range.push(step);
				step += stepSize;
			}

			return range;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Repeat = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Value", [AnyType], 0 ),
									new FLOOD.baseTypes.InputPort( "Count", [Number], 0 )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "Repeat" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(v, t) {

			var a = new QuotedArray();

			if ( t > 0 ) for (var i = 0; i < t; i++) a.push(v);
			return a;

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListLength = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "ListLength" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(l) {
			return l.length;
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

	FLOOD.nodeTypes.ListLast = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListLast" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(l) {
			if (l.length === 0) return null;
			return l[l.length-1];
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListRest = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListRest" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(l) {
			if (l.length <= 1) return [].toQuotedArray();
			return l.slice(1).toQuotedArray();
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListAddToFront = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Item", [AnyTypeButQuotedArray] ), 
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListAddToFront" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(i, l) {
			return [i].concat(l).toQuotedArray();
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

	FLOOD.nodeTypes.ListReverse = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], new QuotedArray() )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListReverse" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(L) {
			return L.slice(0).reverse().toQuotedArray();
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListSort = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function], function(a){ return a; } ),
						new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType], new QuotedArray() )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "ListSort" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.sort(F).toQuotedArray();

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListMap = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function], function(a){ return a; } ),
								new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "ListMap" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(F, L) {

			return L.map(F).toQuotedArray();

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListDivide = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] ),
									new FLOOD.baseTypes.InputPort( "Length", [Number], 1 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "ListDivide" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(l, d) {

			if (l.length === 0) return l;
			if (l.length <= d) return l;
			if (d < 1) return l;

			var acc = new QuotedArray();

			for (var i = 0; i < l.length; i+=d){
				if (i+d > l.length) break;
				acc.push( l.slice(i, i + d ).toQuotedArray() );
			}

			return acc;

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListReduce = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function] ),
									new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] ), 
									new FLOOD.baseTypes.InputPort( "Base", [AnyType] ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function] ),
									new FLOOD.baseTypes.InputPort( "List", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ListFilter" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(F, L) {

			return L.filter(F).toQuotedArray();

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ListFlatten = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [QuotedArray, AnyType] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, AnyType] ) ],
			typeName: "ListFlatten" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a) {

			return a.flatten().toQuotedArray();

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.StringToNumber = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "String", [String] )] ,
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [Number] ) ],
			typeName: "StringToNumber" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(s) {
			return parseFloat(s);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.StringSplit = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "String", [String], " " ),
									new FLOOD.baseTypes.InputPort( "Delimiter", [String], ",") ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [QuotedArray, String] ) ],
			typeName: "StringSplit" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(s, d) {

			return s.split(d).toQuotedArray();

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.StringSubString = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "String", [String], "" ),
									new FLOOD.baseTypes.InputPort( "Start", [Number], 0),
									new FLOOD.baseTypes.InputPort( "Length", [Number], -1) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [String] ) ],
			typeName: "StringSubString" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(s, st, l) {

			if (l < 0) 
				l = undefined;
			return s.substring(st, l);

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Eval = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Code", [String] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "Eval" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a) {
			return eval( a );
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.Apply = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function] ),
									new FLOOD.baseTypes.InputPort( "Arguments", [QuotedArray, AnyType] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "Apply" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(f, a) {
			return f.apply(this, a);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.ApplyToLeaves = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Function", [Function] ),
									new FLOOD.baseTypes.InputPort( "Arguments", [QuotedArray, AnyTypeButQuotedArray] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
			typeName: "ApplyToLeaves" 
		};

		FLOOD.baseTypes.NodeType.call( this, typeData );

		this.eval = function(f, a) {
			return f.apply(this, a);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

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

	FLOOD.nodeTypes.If = function() {

		var typeData = {
			typeName: "if",
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Test", [AnyType], true ),
									new FLOOD.baseTypes.InputPort( "Then", [AnyType] ),
									new FLOOD.baseTypes.InputPort( "Else", [AnyType] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [AnyType] ) ],
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.compile = function() {
			return [this.typeName, this.inputs[0].compile(), this.inputs[1].compile(), 
				this.inputs[2].compile() ];
		}

	}.inherits( FLOOD.baseTypes.NodeType );

	// represents any type
	function AnyType() {};
	FLOOD.AnyType = AnyType;

	function AnyTypeButQuotedArray() {};
	FLOOD.AnyTypeButQuotedArray = AnyTypeButQuotedArray;

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

		if (arg_type === AnyTypeButQuotedArray && arg.constructor != QuotedArray){
			return true;
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

  var prettyPrint = function(key, val){

  	if (val instanceof Array){ return val; }
  	if (typeof val === "function"){ return }

  }

  Function.prototype.mapApply = function( this_arg, args, options ){

	  options = options || {};

	  // check if args matches types expected for node inputs - if so, execute
	  if ( doAllTypesMatch( args, options.expected_arg_types ) ){
	  	return this.apply(this_arg, args);
	  } 

	  var replicationType = options.replication || "applyLongest";

	  var result = this[ replicationType ](this_arg, args, options);

	  if (result.length === 0){
	  	throw new Error("The type of data you supplied to this node is incorrect! The ports were expecting: " 
	  			+ this_arg.inputs.map(function(x){ return x.name + ":" + x.typeName; }).join(", ") );
	  }

	  return result;

  }




	return FLOOD;

});






