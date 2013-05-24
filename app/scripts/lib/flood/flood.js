define(function() {

	if (typeof Object.create !== 'function') {
	    Object.create = function (o) {
	        function F() {}
	        F.prototype = o;
	        return new F();
	    };
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
			var evalClosure = (function() { 
				return function() {
						if ( that.isDirty() ){
							that.value = that.eval.apply(that, arguments);
							that.markClean();
						}
						that.evalComplete(that, arguments);
						return that.value;
					};
			})();

			return [evalClosure].concat( this.inputs.map(function(input){
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
		this.defaultVal = defaultVal || 0;

		this.printExpression = function() {
			if (this.oppNode && this.oppIndex === 0)
				return this.oppNode.printExpression();
			if (this.oppNode && this.oppIndex != 0)
				return '(pick ' + this.oppIndex + ' ' + this.oppNode.printExpression() + ')';
			return this.defaultVal;
		}

		this.compile = function() {
			if (this.oppNode && this.oppIndex === 0)
				return this.oppNode.compile();
			if (this.oppNode && this.oppIndex != 0)
				return ['pick', this.oppIndex, this.oppNode.compile()];
			return this.defaultVal;
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

			var range = new FLOOD.baseTypes.List();

			if (min > max || steps <= 0){
				return range;
			}
			 
			var stepSize = (max - min) / steps;
			for (var i = 0; i < steps; i++){
				range.List.push(i * stepSize);
			}

			return range;

		};

	}.inherits( FLOOD.baseTypes.NodeType );

	return FLOOD;


});





