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

	var axisHelper = new THREE.AxisHelper( 50 );
	scene.add( axisHelper );

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


