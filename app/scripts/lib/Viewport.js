var container, $container;

var camera, controls, scene, renderer;

var geometry, group;

var mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
INTERSECTED, SELECTED;

var objects = [], plane;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
render();

function init() {

	container = document.getElementById("viewer");
	$container = $(container);

	camera = new THREE.PerspectiveCamera( 30, $container.width() / $container.height(), 1, 10000 );

	camera.position.set( 140, 140, 140 );
	camera.up.set( 0, 0, 1 );
	camera.lookAt( new THREE.Vector3(0,0,0) );

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor( 0xffffff, 1 );
	renderer.setSize( $container.width(), $container.height() );
	renderer.sortObjects = false;

	container.appendChild( renderer.domElement );
	renderer.domElement.setAttribute("id", "renderer_canvas");

	makeGrid();

	// add subtle ambient lighting
	var ambientLight = new THREE.AmbientLight(0x555555);
	scene.add(ambientLight);

	// add directional light source
	var directionalLight = new THREE.DirectionalLight(0xbbbbbb);
	directionalLight.position.set(0.5, 0.3, 0.5);
	scene.add(directionalLight);

	var directionalLight = new THREE.DirectionalLight(0xaaaaaa);
	directionalLight.position.set(-0.2, -0.8, 1).normalize();
	scene.add(directionalLight);

	makeGrid();

	controls = new THREE.OrbitControls(camera, container);

	window.addEventListener( 'resize', onWindowResize, false );

	animate();

}

function makeGrid(){

	var l = 60;

	var axisHelper = new THREE.AxisHelper( l );
	scene.add( axisHelper );

	var geometry = new THREE.Geometry();
	var geometryThick = new THREE.Geometry();

	var n = l;
	var inc = 2 * l / n;
	var rate = 10;

	for (var i = 0; i < n + 1; i++){

    	var v1 = new THREE.Vector3(-l, -l + i * inc, 0);
		var v2 = new THREE.Vector3(l, -l + i * inc, 0);

    	geometry.vertices.push(v1);
    	geometry.vertices.push(v2);

    	if (i % rate == 0){
			geometryThick.vertices.push(v1);
    		geometryThick.vertices.push(v2);
    	}
	}

	for (var i = 0; i < n + 1; i++){
		var v1 = new THREE.Vector3(-l + i * inc, l, 0);
		var v2 = new THREE.Vector3(-l + i * inc, -l, 0);

		geometry.vertices.push(v1);
    	geometry.vertices.push(v2);

    	if (i % rate == 0){
			geometryThick.vertices.push(v1);
    		geometryThick.vertices.push(v2);
    	}
	}

	var material = new THREE.LineBasicMaterial({
        color: 0xeeeeee,
        linewidth: 0.1
    });

    var materialThick = new THREE.LineBasicMaterial({
        color: 0xeeeeee,
        linewidth: 2
    });

    var line = new THREE.Line(geometry, material, THREE.LinePieces);
    var lineThick = new THREE.Line(geometryThick, materialThick, THREE.LinePieces);

    scene.add(line);
    scene.add(lineThick);

}

function onWindowResize() {

	windowHalfX = $container.width() / 2;
	windowHalfY = $container.height() / 2;

	camera.aspect = windowHalfX/ windowHalfY;
	camera.updateProjectionMatrix();

	renderer.setSize( 2*windowHalfX, 2*windowHalfY );

	render();

}

function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {
	controls.update();
	renderer.render( scene, camera );
}


