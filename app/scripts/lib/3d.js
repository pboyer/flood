var container, $container;

var camera, controls, scene, projector, renderer;

var geometry, group;

var mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
INTERSECTED, SELECTED;

var objects = [], plane;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

	//container = document.createElement( 'div' );
	container = document.getElementById("viewer");
	$container = $(container);
	//document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 30, $container.width() / $container.height(), 1, 10000 );
	// camera.position.z = 60;

	camera.position.set( 140, 140, 140 );
	camera.up.set( 0, 0, 1 );
	// camera.rotation.set( 1.13,-0.55,-0.23 );
	camera.lookAt( new THREE.Vector3(0,0,0) );

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor( 0xffffff, 1 );
	renderer.setSize( $container.width(), $container.height() );
	renderer.sortObjects = false;

	container.appendChild( renderer.domElement );
	renderer.domElement.setAttribute("id", "renderer_canvas");

	// plane = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100, 20, 20 ), 
	// 	new THREE.MeshBasicMaterial( { color: 0x999999, opacity: 0.25, transparent: false, wireframe: true, wireframeLinewidth: 0.1 } ) );
	// plane.visible = true;
	// scene.add( plane );

	var axisHelper = new THREE.AxisHelper( 50 );
	scene.add( axisHelper );

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

projector = new THREE.Projector();

controls = new THREE.TrackballControls(camera, container);

window.addEventListener( 'resize', onWindowResize, false );

renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

}


function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / $container.width() ) * 2 - 1;
	mouse.y = - ( event.clientY / $container.height() ) * 2 + 1;

	var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );


	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {

		if ( INTERSECTED != intersects[ 0 ].object ) {

			if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

			plane.position.copy( INTERSECTED.position );
			plane.lookAt( camera.position );

		}

		container.style.cursor = 'pointer';

	} else {

		if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

		INTERSECTED = null;

		container.style.cursor = 'auto';

	}

}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {

		controls.enabled = false;

		SELECTED = intersects[ 0 ].object;

		var intersects = raycaster.intersectObject( plane );
		offset.copy( intersects[ 0 ].point ).sub( plane.position );

		container.style.cursor = 'move';

	}

}

function onDocumentMouseUp( event ) {

	event.preventDefault();

	controls.enabled = true;

	if ( INTERSECTED ) {

		plane.position.copy( INTERSECTED.position );

		SELECTED = null;

	}

	container.style.cursor = 'auto';

}

function onWindowResize() {


	windowHalfX = $container.width() / 2;
	windowHalfY = $container.height() / 2;

	camera.aspect = windowHalfX/ windowHalfY;
	camera.updateProjectionMatrix();

	renderer.setSize( 2*windowHalfX, 2*windowHalfY );

}


function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

	controls.update();
	renderer.render( scene, camera );

}