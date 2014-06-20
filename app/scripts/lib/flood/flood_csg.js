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

	FLOOD.nodeTypes.Vector = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "X", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "Y", [Number], 0 ),
						new FLOOD.baseTypes.InputPort( "Z", [Number], 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "Vector"
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(x,y,z) {

			return new CSG.Vector([x,y,z]);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorAdd = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
									new FLOOD.baseTypes.InputPort( "B", [ CSG.Vector ], new CSG.Vector([0,0,0]) ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorAdd" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a.plus(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorMultiply = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
									new FLOOD.baseTypes.InputPort( "Scalar", [ Number ], 1 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorMultiply" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a.times(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorSubtract = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector([1,0,0]) ),
									new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector([0,0,0]) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorSubtract" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a.minus(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorDot = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
									new FLOOD.baseTypes.InputPort( "B", [ CSG.Vector ], new CSG.Vector([0,0,0]) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorDot" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a.dot(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorCross = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Vector ], new CSG.Vector([1,0,0]) ),
									new FLOOD.baseTypes.InputPort( "B", [ CSG.Vector ], new CSG.Vector([0,1,0]) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorCross" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {
			return a.cross(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorNormalized = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector([1,0,0]) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorNormalized" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a) {
			return a.unit();
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorDistance = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
									new FLOOD.baseTypes.InputPort( "B", [ CSG.Vector ], new CSG.Vector([0,0,0]) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorDistance" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a,b) {
			return a.minus(b).length();
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorLength = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector([1,0,0]) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ Number ] ) ],
			typeName: "VectorLength" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a) {
			return a.length();
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.VectorInterp = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
									new FLOOD.baseTypes.InputPort( "B", [ CSG.Vector ], new CSG.Vector([1,0,0]) ),
									new FLOOD.baseTypes.InputPort( "Interp", [ Number ], 0.5 )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorInterp" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, t) {
			return a.lerp(b, t);
		};

	}.inherits( FLOOD.baseTypes.NodeType);

	FLOOD.nodeTypes.VectorComponents = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Vector ], new CSG.Vector([0,0,0]) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "X", [ Number ] ), 
									new FLOOD.baseTypes.OutputPort( "Y", [ Number ] ), 
									new FLOOD.baseTypes.OutputPort( "Z", [ Number ] )],
			typeName: "VectorComponents" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a) {
			return new FLOOD.MultiOutResult({"0" : a.x, "1" : a.y, "2" : a.z });
		};

	}.inherits( FLOOD.baseTypes.NodeType);


	FLOOD.nodeTypes.Point = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector([0,0,0]) ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "Point" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a) {
			return a;
		};

		this.postProcess = function(value){

			var p = { vertices: [] };

			if ( value.map ) {
				for (var i = 0; i < value.length; i++){
					var v = value[i];
					p.vertices.push( [ v.x, v.y, v.z ]);
				}
			}

			p.vertices.push( [ value.x, value.y, value.z ] );

			return p;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.baseTypes.CSG = function(typeData) {

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.postProcess = function(value){

			if ( value.map ) {

				var d = [];
				for (var i = 0; i < value.length; i++){
					d.push( this.toObjectLiteral( value[i] ) );
				}

				return d;
			}

			return this.toObjectLiteral( value );
		};

		this.toObjectLiteral = function( csg_model ) {

			var obj = { vertices : [], faces: [] };
			if (!csg_model || !csg_model.toPolygons) return obj;

			var i, j, vertices, face,
				polygons = csg_model.toPolygons();
				
			for ( i = 0; i < polygons.length; i++ ) {
				
				vertices = [];
				for ( j = 0; j < polygons[i].vertices.length; j++ ) {
					vertices.push( this.getVertexIndex( obj, polygons[i].vertices[j].pos ) );
				}

				if ( vertices[0] === vertices[vertices.length - 1] ) {
					vertices.pop();
				}
				
				for (var j = 2; j < vertices.length; j++) {
					var n = polygons[i].plane.normal;
					face = [ vertices[0], vertices[j-1], vertices[j], [n.x, n.y, n.z] ];
					obj.faces.push( face );
				}
			}
			
			return obj;
		};

		this.getVertexIndex = function ( geometry, pos ) {

			var i;
			for ( i = 0; i < geometry.vertices.length; i++ ) {
				if ( geometry.vertices[i][0] === pos.x && geometry.vertices[i][1] === pos.y && geometry.vertices[i][2] === pos.z ) {
					return i;
				}
			};
			
			geometry.vertices.push( [ pos.x, pos.y, pos.z ] );
			return geometry.vertices.length - 1;
		};

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.nodeTypes.SolidSphere = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Center", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
						new FLOOD.baseTypes.InputPort( "Radius", [Number], 10 ),
						new FLOOD.baseTypes.InputPort( "Slices", [Number], 12 ),
						new FLOOD.baseTypes.InputPort( "Stacks", [Number], 6 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Polygon ] ) ],
			typeName: "SolidSphere" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(cen, rad, xd, yd) {

			return CSG.sphere({
					  center: cen,
					  radius: rad,
					  slices: xd,
					  stacks: yd });
		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidCylinder = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "StartPoint", [ CSG.Vector ], new CSG.Vector([0,-5,0]) ),
						new FLOOD.baseTypes.InputPort( "EndPoint", [ CSG.Vector ], new CSG.Vector([0,2,0]) ),
						new FLOOD.baseTypes.InputPort( "Radius", [Number], 5 ),
						new FLOOD.baseTypes.InputPort( "Slices", [Number], 20 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Polygon ] ) ],
			typeName: "SolidCylinder" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(start, end, radius, slices) {
			return CSG.cylinder({
					  start: start,
					  end: end,
					  radius: radius,
					  slices: slices });
		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidCube = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Center", [ CSG.Vector ], new CSG.Vector([0,-1,0]) ),
						new FLOOD.baseTypes.InputPort( "Radius", [ Number ], 10 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "SolidCube" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(center, radius) {

			return CSG.cube({
					  center: center,
					  radius: radius
					});
		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidIntersect = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG ] ),
						new FLOOD.baseTypes.InputPort( "B", [ CSG ] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "SolidIntersect" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {

			if (!a || !b) return null;

			return a.intersect(b);
		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidUnionAll = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Solids", [ FLOOD.QuotedArray, CSG ]) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "SolidUnionAll" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(s) {

			if (!s || s.length == 0) return null;


			var acc = s.pop();
			return s.reduce(function(a, b){ return a.union(b); }, acc)

		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidUnion = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG ] ),
						new FLOOD.baseTypes.InputPort( "B", [ CSG ] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "SolidUnion" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {

			if (!a || !b) return null;
			return a.union(b);

		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidSubtract = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG ] ),
									new FLOOD.baseTypes.InputPort( "B", [ CSG ] ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "SolidSubtract" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {

			if (!a || !b) return null;

			return a.subtract(b);
		};

	}.inherits( FLOOD.baseTypes.CSG );

});

