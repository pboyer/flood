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


	FLOOD.nodeTypes.CSG = function(typeData) {

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

			var i, j, vertices, face, 
				obj = { vertices : [], faces: [] },
				polygons = csg_model.toPolygons( );
				
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

	FLOOD.nodeTypes.Sphere = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "C", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
						new FLOOD.baseTypes.InputPort( "R", [Number], 10 ),
						new FLOOD.baseTypes.InputPort( "Xd", [Number], 12 ),
						new FLOOD.baseTypes.InputPort( "Yd", [Number], 6 ) ],
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

	}.inherits( FLOOD.nodeTypes.CSG );


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

	}.inherits( FLOOD.nodeTypes.CSG );


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

	}.inherits( FLOOD.nodeTypes.CSG );


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

	}.inherits( FLOOD.nodeTypes.CSG );

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

	}.inherits( FLOOD.nodeTypes.CSG );


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

	}.inherits( FLOOD.nodeTypes.CSG );

});

