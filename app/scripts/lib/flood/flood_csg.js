if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

if (typeof require != 'function' && typeof window != "object") { 

	var define = function(x, y){
		if (typeof x === "function") x(FLOOD);
		if (typeof y === "function") y(FLOOD);
	};

}

define(['FLOOD'], function(FLOOD) {

	FLOOD.nodeTypes.Vec3 = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "X", [Number], 1 ),
						new FLOOD.baseTypes.InputPort( "Y", [Number], 1 ),
						new FLOOD.baseTypes.InputPort( "Z", [Number], 1 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "V", [ CSG.Vector ] ) ],
			typeName: "Vec3"
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(x,y,z) {

			return new CSG.Vector([x,y,z]);
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.Sphere = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "C", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
						new FLOOD.baseTypes.InputPort( "R", [Number], 10 ),
						new FLOOD.baseTypes.InputPort( "Xd", [Number], 16 ),
						new FLOOD.baseTypes.InputPort( "Yd", [Number], 8 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "S", [ CSG.Polygon ] ) ],
			typeName: "Sphere" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(cen, rad, xd, yd) {

			return CSG.sphere({
					  center: cen,
					  radius: rad,
					  slices: xd,
					  stacks: yd });
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.Cyl = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "S", [ CSG.Vector ], new CSG.Vector([0,-5,0]) ),
						new FLOOD.baseTypes.InputPort( "E", [ CSG.Vector ], new CSG.Vector([0,2,0]) ),
						new FLOOD.baseTypes.InputPort( "R", [Number], 5 ),
						new FLOOD.baseTypes.InputPort( "Yd", [Number], 16 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "C", [ CSG.Polygon ] ) ],
			typeName: "Cyl" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(start, end, radius, slices) {
			return CSG.cylinder({
					  start: start,
					  end: end,
					  radius: radius,
					  slices: slices });
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.Cube = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "C", [ CSG.Vector ], new CSG.Vector([0,-1,0]) ),
						new FLOOD.baseTypes.InputPort( "R", [ Number ], 10 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "C", [ CSG.Polygon ] ) ],
			typeName: "Cube" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(center, radius) {

			return CSG.cube({
					  center: center,
					  radius: radius
					});
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.SolidInter = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Polygon ], null ),
						new FLOOD.baseTypes.InputPort( "B", [ CSG.Polygon ], null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [ CSG.Polygon ] ) ],
			typeName: "SolidInter" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {

			if (!a || !b) return null;

			return a.intersect(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.SolidUnion = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Polygon ], null ),
						new FLOOD.baseTypes.InputPort( "B", [ CSG.Polygon ], null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [ CSG.Polygon ] ) ],
			typeName: "SolidUnion" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {

			if (!a || !b) return null;

			return a.union(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.SolidDiff = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Polygon ], null ),
						new FLOOD.baseTypes.InputPort( "B", [ CSG.Polygon ], null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", [ CSG.Polygon ] ) ],
			typeName: "SolidDiff" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {

			if (!a || !b) return null;

			return a.subtract(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

});

