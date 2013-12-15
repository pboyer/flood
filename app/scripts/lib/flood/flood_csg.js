define(['FLOOD'], function(FLOOD) {

	FLOOD.nodeTypes.Vec3 = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "X", "number", 0 ),
						new FLOOD.baseTypes.InputPort( "Y", "number", 0 ),
						new FLOOD.baseTypes.InputPort( "Z", "number", 0 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "V", "vec3" ) ],
			typeName: "Vec3" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(x,y,z) {
			return new CSG.Vector([x,y,z]);
		};

	}.inherits( FLOOD.baseTypes.NodeType );


	FLOOD.nodeTypes.Sphere = function() {

		var typeData = {
			inputs: [ 	new FLOOD.baseTypes.InputPort( "C", "vec3", new CSG.Vector([0,0,0]) ),
						new FLOOD.baseTypes.InputPort( "R", "number", 10 ),
						new FLOOD.baseTypes.InputPort( "Xd", "number", 16 ),
						new FLOOD.baseTypes.InputPort( "Yd", "number", 8 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "S", "polygon" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "S", "vec3", new CSG.Vector([0,-5,0]) ),
						new FLOOD.baseTypes.InputPort( "E", "vec3", new CSG.Vector([0,2,0]) ),
						new FLOOD.baseTypes.InputPort( "R", "number", 5 ),
						new FLOOD.baseTypes.InputPort( "Yd", "number", 16 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "C", "polygon" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "C", "vec3", new CSG.Vector([0,-1,0]) ),
						new FLOOD.baseTypes.InputPort( "R", "number", 10 ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "C", "polygon" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", "polygon", null ),
						new FLOOD.baseTypes.InputPort( "B", "polygon", null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "polygon" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", "polygon", null ),
						new FLOOD.baseTypes.InputPort( "B", "polygon", null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "polygon" ) ],
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
			inputs: [ 	new FLOOD.baseTypes.InputPort( "A", "polygon", null ),
						new FLOOD.baseTypes.InputPort( "B", "polygon", null ) ],
			outputs: [ 	new FLOOD.baseTypes.OutputPort( "O", "polygon" ) ],
			typeName: "SolidDiff" 
		};

		FLOOD.baseTypes.NodeType.call(this, typeData );

		this.eval = function(a, b) {

			if (!a || !b) return null;

			return a.subtract(b);
		};

	}.inherits( FLOOD.baseTypes.NodeType );

});

