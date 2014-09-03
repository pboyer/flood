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

	CSG.prototype.render = function() {

		var obj = { vertices : [], faces: [] };

		var i, j, vertices, face,
			polygons = this.toPolygons();
			
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

	CSG.prototype.getVertexIndex = function ( geometry, pos ) {

		var i;
		for ( i = 0; i < geometry.vertices.length; i++ ) {
			if ( geometry.vertices[i][0] === pos.x && geometry.vertices[i][1] === pos.y && geometry.vertices[i][2] === pos.z ) {
				return i;
			}
		};
		
		geometry.vertices.push( [ pos.x, pos.y, pos.z ] );
		return geometry.vertices.length - 1;
	};

	CSG.Polygon.prototype.render = function() {

		var obj = { linestrip : [] }
			, vertices = this.vertices;
			
		for ( var i = 0; i < vertices.length; i++ ) { 
			obj.linestrip.push( [vertices[i].pos.x, vertices[i].pos.y, vertices[i].pos.z] );
		}

		obj.linestrip.push( [vertices[0].pos.x, vertices[0].pos.y, vertices[0].pos.z] );
	

		return obj;
	};

	CSG.Plane.prototype.render = function() {

		var origin = this.origin;

		var linestrip = [ origin.plus( this.xaxis )
										, origin.minus( this.xaxis )
										, origin
										, origin.minus( this.yaxis )
										, origin.plus( this.yaxis )
										, origin
										, origin.plus( this.normal ) ];

		linestrip = linestrip.map(function(x){ return [x.x, x.y, x.z]; });

		return{ "linestrip": linestrip };

	};


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

	FLOOD.nodeTypes.VectorLerp = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
									new FLOOD.baseTypes.InputPort( "B", [ CSG.Vector ], new CSG.Vector([1,0,0]) ),
									new FLOOD.baseTypes.InputPort( "Interp", [ Number ], 0.5 )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Vector ] ) ],
			typeName: "VectorLerp" 
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

	var csgPostProcess = function(value){

		if (!value) return {};

		if ( value.map ) {

			var d = [];
			for (var i = 0; i < value.length; i++){
				if (value[i] === undefined) continue;
				d.push( value[i].render ? value[i].render() : value[i] );
			}

			return d;
		}

		if (!value.render) return value;

		return value.render();

	};

	FLOOD.baseTypes.CSG = function(typeData) {

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.postProcess = csgPostProcess;

	}.inherits( FLOOD.baseTypes.NodeType );

	FLOOD.baseTypes.NodeType.prototype.postProcess = csgPostProcess;

	FLOOD.nodeTypes.Plane = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Origin", [ CSG.Vector ], new CSG.Vector(0,0,0) ),
			 						new FLOOD.baseTypes.InputPort( "XAxis", [ CSG.Vector ], new CSG.Vector(1,0,0) ),
			 						new FLOOD.baseTypes.InputPort( "YAxis", [ CSG.Vector ], new CSG.Vector(0,1,0) ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Plane ] ) ],
			typeName: "Plane" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.eval = function(o, x, y) {

			var n = x.cross(y).unit();
			var w = n.dot(o);

			var pl = new CSG.Plane(n,w);
			pl.origin = o;
			pl.xaxis = x.unit();
			pl.yaxis = n.cross(pl.xaxis);
			
			return pl;

		};

	}.inherits( FLOOD.baseTypes.CSG );

	var initPlane = function(){

		var n = new CSG.Vector(0,0,1);
		var w = 0;

		var pl = new CSG.Plane(n,w);
		
		pl.origin = new CSG.Vector(0,0,0);
		pl.xaxis = new CSG.Vector(1,0,0);
		pl.yaxis = new CSG.Vector(0,1,0);

		return pl;

	};

	var ptOnPlane = function(pl, x, y){
		return pl.origin.plus( pl.xaxis.times( x ).plus( pl.yaxis.times( y ) ) );
	};

	FLOOD.nodeTypes.RegularPolygon = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Sides", [ Number ], 3 ),
			 						new FLOOD.baseTypes.InputPort( "Radius", [ Number ], 10 ),
			 						new FLOOD.baseTypes.InputPort( "Plane", [ CSG.Plane ], initPlane() )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Polygon ] ) ],
			typeName: "RegularPolygon" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.eval = function(numSides, radius, pl) {

			numSides = Math.floor(numSides);

			if (numSides < 3) throw new Error("Sides must be >= 3");

			var inc = 2 * Math.PI / numSides;

			var pts = [];
			var ang = 0;

			for (var i = 0; i < numSides; i++) {
				ang += inc;
				pts.push( ptOnPlane(pl, radius * Math.cos(ang), radius * Math.sin(ang) ) );
			}

			return CSG.Polygon.createFromPoints( pts, false );

		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.Rectangle = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Width", [ Number ], 5 ),
			 						new FLOOD.baseTypes.InputPort( "Height", [ Number ], 10 ),
			 						new FLOOD.baseTypes.InputPort( "Plane", [ CSG.Plane ], initPlane() )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Polygon ] ) ],
			typeName: "Rectangle" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.eval = function(width, height, pl) {

			var pts = [
				ptOnPlane(pl, width/2, height/2),
				ptOnPlane(pl, -width/2, height/2),
				ptOnPlane(pl, -width/2, -height/2),
				ptOnPlane(pl, width/2, -height/2)
			];

			return CSG.Polygon.createFromPoints( pts, false );

		};

	}.inherits( FLOOD.baseTypes.CSG );
	
	FLOOD.nodeTypes.Polygon = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Corners", [ FLOOD.QuotedArray, CSG.Vector ] )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG.Polygon ] ) ],
			typeName: "Polygon" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData);

		this.eval = function(pts) {

			if (pts.length < 3) throw new Exception("You need more than 3 points to make a polygon");

			return CSG.Polygon.createFromPoints( pts, false );

		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidCuboid = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "MinCorner", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
						new FLOOD.baseTypes.InputPort( "MaxCorner", [ CSG.Vector ], new CSG.Vector([5, 5, 5]) ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "SolidCuboid" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(minPoint, maxPoint) {

			if (minPoint.z > maxPoint.z ){
				var t = minPoint;
				minPoint = maxPoint;
				maxPoint = t;
			}

			var x = new CSG.Vector([1,0,0]);
			var y = new CSG.Vector([0,1,0]);
			var w = maxPoint.x - minPoint.x;
			var h = maxPoint.y - minPoint.y;
			var d = maxPoint.z - minPoint.z;

			var pts = [
				minPoint, 
				minPoint.plus( x.times(w) ),
				minPoint.plus( x.times(w)).plus( y.times(h) ),
				minPoint.plus( y.times(h) )
			];

			var poly = CSG.Polygon.createFromPoints( pts, false );

			return extrude( poly, new CSG.Vector( [0,0,d] ));

		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.SolidCube = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Center", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
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

	// FLOOD.nodeTypes.ScaleUneven ( Solid, Plane, XFactor, YFactor, ZFactor )

	FLOOD.nodeTypes.SolidSphere = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Center", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
						new FLOOD.baseTypes.InputPort( "Radius", [Number], 10 ),
						new FLOOD.baseTypes.InputPort( "Slices", [Number], 12 ),
						new FLOOD.baseTypes.InputPort( "Stacks", [Number], 6 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
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
						new FLOOD.baseTypes.InputPort( "EndPoint", [ CSG.Vector ], new CSG.Vector([0,5,0]) ),
						new FLOOD.baseTypes.InputPort( "Radius", [Number], 5 ),
						new FLOOD.baseTypes.InputPort( "Slices", [Number], 20 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
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

	var extrude = function(polygon, offset) {

		// get CS from profile plane
		var plane = polygon.plane;
		var z = plane.normal;
		var o = z.times( plane.w );

		var helperVec = z.minus(new CSG.Vector(1,0,0)).length() < 1e-5 ? new CSG.Vector(1,0,0) : new CSG.Vector(0,1,0);

		var x = z.cross( helperVec ).unit();
		var y = z.cross( x );

		var trf = new CSG.Matrix4x4( [ 	x.x, x.y, x.z, o.x, 
																		y.x, y.y, y.z, o.y, 
																		z.x, z.y, z.z, o.z,
																		0,   0,   0,   1    ]);

		var trfinv = new CSG.Matrix4x4( [ 	x.x, y.x, z.x, -o.x, 
																				x.y, y.y, z.y, -o.y, 
																				x.z, y.z, z.z, -o.z,
																				0,   0,   0,   1    ]);

		var cc = [];

		for (var i = 0; i < polygon.vertices.length; i++){

			var cp = polygon.vertices[i].pos;

			// align polygon with 2d CS
			var cpp = cp.multiply4x4( trfinv );

			cc.push( new CSG.Vector2D( cpp.x, cpp.y ) );

		}

		// extrude to create polygon
		var profile2D = new CSG.Polygon2D( cc, false );

		// transform the extrusion vector
		var offsetTrf = trf.rightMultiply1x3Vector( offset );
		var ext = profile2D.extrude({ offset: offsetTrf });

		// transform back to original CS
		return ext.transform( trf );

	};

	FLOOD.nodeTypes.SolidExtrusion = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Profile", [ CSG.Polygon ] ),
									new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector(0, 0, 1) ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "SolidExtrusion" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = extrude;

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
			return a.subtract(b);
		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.Move = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Geom", [ FLOOD.AnyTypeButQuotedArray ] ),
									new FLOOD.baseTypes.InputPort( "Vector", [ CSG.Vector ], new CSG.Vector( [0,0,0] ) )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "Move" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(s, v) {
			return s.transform( CSG.Matrix4x4.translation( v ) );
		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.Scale = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Geom", [ FLOOD.AnyTypeButQuotedArray ] ),
						new FLOOD.baseTypes.InputPort( "Center", [ CSG.Vector ], new CSG.Vector([0,0,0]) ),
						new FLOOD.baseTypes.InputPort( "Factor", [ Number ], 1 )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "Scale" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(s, c, f) {

			var m0 = CSG.Matrix4x4.translation( c.negated() );
			var sc = CSG.Matrix4x4.scaling( [f,f,f] );
			var m1 = CSG.Matrix4x4.translation( c );
			var tr = m1.multiply(sc).multiply(m0);

			return s.transform( tr );

		};

	}.inherits( FLOOD.baseTypes.CSG );

	FLOOD.nodeTypes.Rotate = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "Geom", [ FLOOD.AnyTypeButQuotedArray ] ),
									new FLOOD.baseTypes.InputPort( "Axis", [ CSG.Vector ], new CSG.Vector([0,0,1]) ),
									new FLOOD.baseTypes.InputPort( "Degrees", [ Number ], 30 )],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "⇒", [ CSG ] ) ],
			typeName: "Rotate" 
		};

		var matrixFromAxisAngle = function(angle, axis) {

	    var c = Math.cos(angle);
	    var s = Math.sin(angle);
	    var t = 1.0 - c;

	    var m00 = c + axis.x*axis.x*t;
	    var m11 = c + axis.y*axis.y*t;
	    var m22 = c + axis.z*axis.z*t;

	    var tmp1 = axis.x*axis.y*t;
	    var tmp2 = axis.z*s;
	    var m10 = tmp1 + tmp2;
	    var m01 = tmp1 - tmp2;
	    var tmp1 = axis.x*axis.z*t;
	    var tmp2 = axis.y*s;
	    var m20 = tmp1 - tmp2;
	    var m02 = tmp1 + tmp2;    
	    var tmp1 = axis.y*axis.z*t;
	    var tmp2 = axis.x*s;
	    var m21 = tmp1 + tmp2;
	    var m12 = tmp1 - tmp2;

	    return new CSG.Matrix4x4([ m00, m01, m02, 0,
										    				 m10, m11, m12, 0,
										    				 m20, m21, m22, 0,
										    				 0,		0, 		 0, 1 ] );

		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(s, ax, ang) {

			var tr = matrixFromAxisAngle( ang * Math.PI / 180, ax.unit() );
			return s.transform( tr );

		};

	}.inherits( FLOOD.baseTypes.CSG );

});

