// from the book
Function.prototype.partial = function(){
  var fn = this, args = Array.prototype.slice.call(arguments);
  return function(){
    var arg = 0;
    for ( var i = 0; i < args.length && arg < arguments.length; i++ )
      if ( args[i] === undefined )
        args[i] = arguments[arg++];
    return fn.apply(this, args);
  };
};

// modified to not change the args array on every invocation
// of fn
Function.prototype.partialb = function(){
  var fn = this, args = Array.prototype.slice.call(arguments);

  return function(){

    var current_args = new Array(args.length);
    var arg = 0;

    for ( var i = 0; i < args.length; i++ ){
      if ( args[i] === undefined ){
        current_args[i] = arguments[arg++];
      } else {
        current_args[i] = args[i];
      }
    }

    return fn.apply(this, current_args);
  };
};

// partial function application
Function.prototype.curry = function() {
  var fn = this, args = Array.prototype.slice.call(arguments);

  return function() {
    return fn.apply(this, args.concat(
      Array.prototype.slice.call(arguments)));
  };
};


function add(a, b){
  return a + b;
}


var add1 = add.partial(1, undefined);

console.log( add1(5) );
console.log( add1(6) );


var add1b = add.partialb(1, undefined);

console.log( add1b(5) );
console.log( add1b(6) );

var add1curry = add.curry(1);

console.log( add1curry(5) );
console.log( add1curry(6) );


