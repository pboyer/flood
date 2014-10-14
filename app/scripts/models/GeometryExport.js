define(['FileSaver'], function(FileSaver) {

	/// Adapted from: https://github.com/stephomi/sculptgl/blob/master/src/misc/ExportSTL.js

	'use strict';

	var Export = {};
	var Utils = {};

	/** Export STL file */
	Export.toSTL = function (scene, filename) {

		// merge all Geometry in three.js scene into one big bag of triangles
		var numTris = 0;
		var vertices = [];
		var faces = [];
		var faceNormals = [];
		var vertOffset = 0;

     	scene.traverse(function(ele) {
	    	
     		if (!ele.visible || !(ele instanceof THREE.Mesh) ) return;

 			// collect vertices
 			ele.geometry.vertices.forEach(function(v){
 				vertices.push( v.x );
 				vertices.push( v.y );
 				vertices.push( v.z );
 			});

 			// collect faces, face normals
 			ele.geometry.faces.forEach(function(face){
 				faces.push(vertOffset + face.a);
 				faces.push(vertOffset + face.b);
 				faces.push(vertOffset + face.c);

 				faceNormals.push( face.normal.x );
 				faceNormals.push( face.normal.y );
 				faceNormals.push( face.normal.z );

 				numTris += 1;
 			});

 			vertOffset += ele.geometry.vertices.length;

      	});

     	var blob = Export.toAsciiSTL(vertices, faces, faceNormals, numTris );

     	FileSaver( blob, filename );
		
	};

	Utils.normalizeArrayVec3 = function (array, out) {
		var arrayOut = out || array;
		for (var i = 0, l = array.length; i < l; ++i) {
		  var j = i * 3;
		  var nx = array[j];
		  var ny = array[j + 1];
		  var nz = array[j + 2];
		  var len = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
		  arrayOut[j] = nx * len;
		  arrayOut[j + 1] = ny * len;
		  arrayOut[j + 2] = nz * len;
		}
		return arrayOut;
	};

	/** Return a buffer array which is at least nbBytes long */
	Utils.getMemory = (function () {
		var pool = new ArrayBuffer(100000);
		return function (nbBytes) {
		  if (pool.byteLength >= nbBytes)
		    return pool;
		  pool = new ArrayBuffer(nbBytes);
		  return pool;
		};
	})();

	/** Export Ascii STL file */
	Export.toAsciiSTL = function (vAr, iAr, origFN, nbTriangles) {

		var faceNormals = new Float32Array(Utils.getMemory(origFN.length * 4), 0, origFN.length);
		Utils.normalizeArrayVec3(origFN, faceNormals);
		var data = 'solid mesh\n';

		for (var i = 0; i < nbTriangles; ++i) {
		  var j = i * 3;
		  data += ' facet normal ' + faceNormals[j] + ' ' + faceNormals[j + 1] + ' ' + faceNormals[j + 2] + '\n';
		  data += '  outer loop\n';
		  var iv1 = iAr[j] * 3;
		  var iv2 = iAr[j + 1] * 3;
		  var iv3 = iAr[j + 2] * 3;
		  data += '   vertex ' + vAr[iv1] + ' ' + vAr[iv1 + 1] + ' ' + vAr[iv1 + 2] + '\n';
		  data += '   vertex ' + vAr[iv2] + ' ' + vAr[iv2 + 1] + ' ' + vAr[iv2 + 2] + '\n';
		  data += '   vertex ' + vAr[iv3] + ' ' + vAr[iv3 + 1] + ' ' + vAr[iv3 + 2] + '\n';
		  data += '  endloop\n';
		  data += ' endfacet\n';
		}
		data += 'endsolid mesh\n';

		return new Blob([data]);
	};

	return Export;

});