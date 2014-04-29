/**
 * @author Eberhard Graether / http://egraether.com/
 */

THREE.TrackballControls = function ( object, domElement ) {


	// THREE.EventDispatcher.call( this );
	this.eventDispatcher = new THREE.EventDispatcher();


	var _this = this;
	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM: 4, TOUCH_PAN: 5 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	this.enabled = true;

	this.screen = { width: 0, height: 0, offsetLeft: 0, offsetTop: 0 };
	this.radius = ( this.screen.width + this.screen.height ) / 4;

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 0.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = 2000;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals

	this.target = new THREE.Vector3();

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
	_prevState = STATE.NONE,

	_eye = new THREE.Vector3(),

	_rotateStart = new THREE.Vector3(),
	_rotateEnd = new THREE.Vector3(),

	_zoomStart = new THREE.Vector2(),
	_zoomEnd = new THREE.Vector2(),

	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	// events

	var changeEvent = { type: 'change' };


	// methods

	this.handleResize = function () {

		this.screen.width = window.innerWidth;
		this.screen.height = window.innerHeight;

		this.screen.offsetLeft = 0;
		this.screen.offsetTop = 0;

		this.radius = ( this.screen.width + this.screen.height ) / 4;

	};

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	this.getMouseOnScreen = function ( clientX, clientY ) {

		return new THREE.Vector2(
			( clientX - _this.screen.offsetLeft ) / _this.radius * 0.5,
			( clientY - _this.screen.offsetTop ) / _this.radius * 0.5
		);

	};

	this.getMouseProjectionOnBall = function ( clientX, clientY ) {

		var mouseOnBall = new THREE.Vector3(
			( clientX - _this.screen.width * 0.5 - _this.screen.offsetLeft ) / _this.radius,
			( _this.screen.height * 0.5 + _this.screen.offsetTop - clientY ) / _this.radius,
			0.0
		);

		var length = mouseOnBall.length();

		if ( length > 1.0 ) {

			mouseOnBall.normalize();

		} else {

			mouseOnBall.z = Math.sqrt( 1.0 - length * length );

		}

		_eye.copy( _this.object.position ).sub( _this.target );

		var projection = _this.object.up.clone().setLength( mouseOnBall.y );
		projection.add( _this.object.up.clone().cross( _eye ).setLength( mouseOnBall.x ) );
		projection.add( _eye.setLength( mouseOnBall.z ) );

		return projection;

	};

	this.rotateCamera = function () {

		var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );

		if ( angle ) {

			var axis = ( new THREE.Vector3() ).crossVectors( _rotateStart, _rotateEnd ).normalize(),
				quaternion = new THREE.Quaternion();

			angle *= _this.rotateSpeed;

			quaternion.setFromAxisAngle( axis, -angle );

			_eye.applyQuaternion( quaternion );
			_this.object.up.applyQuaternion( quaternion );

			_rotateEnd.applyQuaternion( quaternion );

			if ( _this.staticMoving ) {

				_rotateStart.copy( _rotateEnd );

			} else {

				quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
				_rotateStart.applyQuaternion( quaternion );

			}

		}

	};

	this.zoomCamera = function () {

		if ( _state === STATE.TOUCH_ZOOM ) {

			var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );

		} else {

			var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				_eye.multiplyScalar( factor );

				if ( _this.staticMoving ) {

					_zoomStart.copy( _zoomEnd );

				} else {

					_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

				}

			}

		}

	};

	this.panCamera = function () {

		var mouseChange = _panEnd.clone().sub( _panStart );

		if ( mouseChange.lengthSq() ) {

			mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

			var pan = _eye.clone().cross( _this.object.up ).setLength( mouseChange.x );
			pan.add( _this.object.up.clone().setLength( mouseChange.y ) );

			_this.object.position.add( pan );
			_this.target.add( pan );

			if ( _this.staticMoving ) {

				_panStart = _panEnd;

			} else {

				_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

			}

		}

	};

	this.checkDistances = function () {

		if ( !_this.noZoom || !_this.noPan ) {

			if ( _this.object.position.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				_this.object.position.setLength( _this.maxDistance );

			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );

			}

		}

	};

	this.update = function () {

		_eye.subVectors( _this.object.position, _this.target );

		if ( !_this.noRotate ) {

			_this.rotateCamera();

		}

		if ( !_this.noZoom ) {

			_this.zoomCamera();

		}

		if ( !_this.noPan ) {

			_this.panCamera();

		}

		_this.object.position.addVectors( _this.target, _eye );

		_this.checkDistances();

		_this.object.lookAt( _this.target );

		if ( lastPosition.distanceToSquared( _this.object.position ) > 0 ) {
			_this.eventDispatcher.dispatchEvent( changeEvent );


			lastPosition.copy( _this.object.position );

		}

	};

	// listeners

	// function keydown( event ) {

	// 	if ( _this.enabled === false ) return;

	// 	window.removeEventListener( 'keydown', keydown );

	// 	_prevState = _state;

	// 	if ( _state !== STATE.NONE ) {

	// 		return;

	// 	} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

	// 		_state = STATE.ROTATE;

	// 	} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {

	// 		_state = STATE.ZOOM;

	// 	} else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {

	// 		_state = STATE.PAN;

	// 	}

	// }

	// function keyup( event ) {

	// 	if ( _this.enabled === false ) return;

	// 	_state = _prevState;

	// 	window.addEventListener( 'keydown', keydown, false );

	// }

	function mousedown( event ) {

		if ( _this.enabled === false ) return;

		if (event.toElement.getAttribute("id") != "renderer_canvas")
			return;
		
		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {

			_state = event.button;

		}

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomStart = _zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panStart = _panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

	}

	function mousemove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		}

	}

	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );

	}

	function mousewheel( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta / 40;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail / 3;

		}

		_zoomStart.y += ( 1 / delta ) * 0.05;

	}

	function touchstart( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:
				_state = STATE.TOUCH_ZOOM;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );
				break;

			case 3:
				_state = STATE.TOUCH_PAN;
				_panStart = _panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1:
				_rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy )
				break;

			case 3:
				_panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:
				_touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
				break;

			case 3:
				_panStart = _panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

		}

		_state = STATE.NONE;

	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousedown', mousedown, false );

	this.domElement.addEventListener( 'mousewheel', mousewheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	// window.addEventListener( 'keydown', keydown, false );
	// window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

};




// /**
//  * @author qiao / https://github.com/qiao
//  * @author mrdoob / http://mrdoob.com
//  * @author alteredq / http://alteredqualia.com/
//  * @author WestLangley / http://github.com/WestLangley
//  */

// THREE.OrbitControls = function ( object, domElement ) {

// 	this.object = object;
// 	this.domElement = ( domElement !== undefined ) ? domElement : document;

// 	// API

// 	this.enabled = true;

// 	this.center = new THREE.Vector3();

// 	this.userZoom = true;
// 	this.userZoomSpeed = 1.0;

// 	this.userRotate = true;
// 	this.userRotateSpeed = 1.0;

// 	this.userPan = true;
// 	this.userPanSpeed = 2.0;

// 	this.autoRotate = false;
// 	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

// 	this.minPolarAngle = 0; // radians
// 	this.maxPolarAngle = Math.PI; // radians

// 	this.minDistance = 0;
// 	this.maxDistance = Infinity;

// 	// 65 /*A*/, 83 /*S*/, 68 /*D*/
// 	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40, ROTATE: 65, ZOOM: 83, PAN: 68 };

// 	// internals

// 	var scope = this;

// 	var EPS = 0.000001;
// 	var PIXELS_PER_ROUND = 1800;

// 	var rotateStart = new THREE.Vector2();
// 	var rotateEnd = new THREE.Vector2();
// 	var rotateDelta = new THREE.Vector2();

// 	var zoomStart = new THREE.Vector2();
// 	var zoomEnd = new THREE.Vector2();
// 	var zoomDelta = new THREE.Vector2();

// 	var phiDelta = 0;
// 	var thetaDelta = 0;
// 	var scale = 1;

// 	var lastPosition = new THREE.Vector3();

// 	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
// 	var state = STATE.NONE;

// 	// events

// 	var changeEvent = { type: 'change' };


// 	this.rotateLeft = function ( angle ) {

// 		if ( angle === undefined ) {

// 			angle = getAutoRotationAngle();

// 		}

// 		thetaDelta -= angle;

// 	};

// 	this.rotateRight = function ( angle ) {

// 		if ( angle === undefined ) {

// 			angle = getAutoRotationAngle();

// 		}

// 		thetaDelta += angle;

// 	};

// 	this.rotateUp = function ( angle ) {

// 		if ( angle === undefined ) {

// 			angle = getAutoRotationAngle();

// 		}

// 		phiDelta -= angle;

// 	};

// 	this.rotateDown = function ( angle ) {

// 		if ( angle === undefined ) {

// 			angle = getAutoRotationAngle();

// 		}

// 		phiDelta += angle;

// 	};

// 	this.zoomIn = function ( zoomScale ) {

// 		if ( zoomScale === undefined ) {

// 			zoomScale = getZoomScale();

// 		}

// 		scale /= zoomScale;

// 	};

// 	this.zoomOut = function ( zoomScale ) {

// 		if ( zoomScale === undefined ) {

// 			zoomScale = getZoomScale();

// 		}

// 		scale *= zoomScale;

// 	};

// 	this.pan = function ( distance ) {

// 		distance.transformDirection( this.object.matrix );
// 		distance.multiplyScalar( scope.userPanSpeed );

// 		this.object.position.add( distance );
// 		this.center.add( distance );

// 	};

// 	this.update = function () {

// 		var position = this.object.position;
// 		var offset = position.clone().sub( this.center );

// 		// angle from z-axis around y-axis

// 		var theta = Math.atan2( offset.x, offset.z );

// 		// angle from y-axis

// 		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

// 		if ( this.autoRotate ) {

// 			this.rotateLeft( getAutoRotationAngle() );

// 		}

// 		theta += thetaDelta;
// 		phi += phiDelta;

// 		// restrict phi to be between desired limits
// 		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

// 		// restrict phi to be betwee EPS and PI-EPS
// 		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

// 		var radius = offset.length() * scale;

// 		// restrict radius to be between desired limits
// 		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

// 		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
// 		offset.y = radius * Math.cos( phi );
// 		offset.z = radius * Math.sin( phi ) * Math.cos( theta );

// 		position.copy( this.center ).add( offset );

// 		this.object.lookAt( this.center );

// 		thetaDelta = 0;
// 		phiDelta = 0;
// 		scale = 1;

// 		if ( lastPosition.distanceTo( this.object.position ) > 0 ) {

// 			this.dispatchEvent( changeEvent );

// 			lastPosition.copy( this.object.position );

// 		}

// 	};


// 	function getAutoRotationAngle() {

// 		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

// 	}

// 	function getZoomScale() {

// 		return Math.pow( 0.95, scope.userZoomSpeed );

// 	}

// 	function onMouseDown( event ) {

// 		if ( scope.enabled === false ) return;
// 		if ( scope.userRotate === false ) return;

// 		event.preventDefault();

// 		if ( state === STATE.NONE )
// 		{
// 			if ( event.button === 0 )
// 				state = STATE.ROTATE;
// 			if ( event.button === 1 )
// 				state = STATE.ZOOM;
// 			if ( event.button === 2 )
// 				state = STATE.PAN;
// 		}
		
		
// 		if ( state === STATE.ROTATE ) {

// 			//state = STATE.ROTATE;

// 			rotateStart.set( event.clientX, event.clientY );

// 		} else if ( state === STATE.ZOOM ) {

// 			//state = STATE.ZOOM;

// 			zoomStart.set( event.clientX, event.clientY );

// 		} else if ( state === STATE.PAN ) {

// 			//state = STATE.PAN;

// 		}

// 		document.addEventListener( 'mousemove', onMouseMove, false );
// 		document.addEventListener( 'mouseup', onMouseUp, false );

// 	}

// 	function onMouseMove( event ) {

// 		if ( scope.enabled === false ) return;

// 		event.preventDefault();

		
		
// 		if ( state === STATE.ROTATE ) {

// 			rotateEnd.set( event.clientX, event.clientY );
// 			rotateDelta.subVectors( rotateEnd, rotateStart );

// 			scope.rotateLeft( 2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed );
// 			scope.rotateUp( 2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed );

// 			rotateStart.copy( rotateEnd );

// 		} else if ( state === STATE.ZOOM ) {

// 			zoomEnd.set( event.clientX, event.clientY );
// 			zoomDelta.subVectors( zoomEnd, zoomStart );

// 			if ( zoomDelta.y > 0 ) {

// 				scope.zoomIn();

// 			} else {

// 				scope.zoomOut();

// 			}

// 			zoomStart.copy( zoomEnd );

// 		} else if ( state === STATE.PAN ) {

// 			var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
// 			var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

// 			scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

// 		}

// 	}

// 	function onMouseUp( event ) {

// 		if ( scope.enabled === false ) return;
// 		if ( scope.userRotate === false ) return;

// 		document.removeEventListener( 'mousemove', onMouseMove, false );
// 		document.removeEventListener( 'mouseup', onMouseUp, false );

// 		state = STATE.NONE;

// 	}

// 	function onMouseWheel( event ) {

// 		if ( scope.enabled === false ) return;
// 		if ( scope.userZoom === false ) return;

// 		var delta = 0;

// 		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

// 			delta = event.wheelDelta;

// 		} else if ( event.detail ) { // Firefox

// 			delta = - event.detail;

// 		}

// 		if ( delta > 0 ) {

// 			scope.zoomOut();

// 		} else {

// 			scope.zoomIn();

// 		}

// 	}

// 	function onKeyDown( event ) {

// 		if ( scope.enabled === false ) return;
// 		if ( scope.userPan === false ) return;

// 		switch ( event.keyCode ) {

// 			/*case scope.keys.UP:
// 				scope.pan( new THREE.Vector3( 0, 1, 0 ) );
// 				break;
// 			case scope.keys.BOTTOM:
// 				scope.pan( new THREE.Vector3( 0, - 1, 0 ) );
// 				break;
// 			case scope.keys.LEFT:
// 				scope.pan( new THREE.Vector3( - 1, 0, 0 ) );
// 				break;
// 			case scope.keys.RIGHT:
// 				scope.pan( new THREE.Vector3( 1, 0, 0 ) );
// 				break;
// 			*/
// 			case scope.keys.ROTATE:
// 				state = STATE.ROTATE;
// 				break;
// 			case scope.keys.ZOOM:
// 				state = STATE.ZOOM;
// 				break;
// 			case scope.keys.PAN:
// 				state = STATE.PAN;
// 				break;
				
// 		}

// 	}
	
// 	function onKeyUp( event ) {

// 		switch ( event.keyCode ) {

// 			case scope.keys.ROTATE:
// 			case scope.keys.ZOOM:
// 			case scope.keys.PAN:
// 				state = STATE.NONE;
// 				break;
// 		}

// 	}

// 	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
// 	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
// 	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
// 	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
// 	window.addEventListener( 'keydown', onKeyDown, false );
// 	window.addEventListener( 'keyup', onKeyUp, false );

// };

// THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );


