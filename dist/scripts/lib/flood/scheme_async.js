if (typeof define !== 'function' && typeof require === 'function') {
    var define = require('amdefine')(module);
} 

if (typeof require != 'function' && typeof window != "object") { 

	var scheme = {};
	var define = function(x, y){
		if (typeof x === "function") scheme = x();
		if (typeof y === "function") scheme = y();
	};

}


define(function() {

  // an extremely small async promise implementation
  var Promise = function(func){

    this.f = func;
    this.redeemed = false;
    var shouldContinue = true;

    this.then = function(func){

      this.next = func.constructor === Promise ? func : new Promise(func);
      this.next.first = this;

      return this.next;

    };

    this.test = function(trueFunc, falseFunc){

    	this.nextTrue = trueFunc.constructor === Promise ? trueFunc : new Promise(trueFunc);
    	this.nextFalse = falseFunc.constructor === Promise ? falseFunc : new Promise(falseFunc);

    	this.nextTrue.first = this;
    	this.nextFalse.first = this;

    	return this.nextFalse;

    };

    this.cancel = function(){

    	shouldContinue = false;

    };

    this.done = function(){

      var that = this;
      var args = arguments;

      // do work async
      setTimeout(function(){

        if ( that.first && !that.first.redeemed ){
          return that.first.done.apply( that.first, args );
        }

        var res = that.f.apply(that, args);
        that.redeemed = true;

        that.continueNext( res );

      }, 0);

     };

     this.continueNext = function(res){

     		if ( !shouldContinue ) return res;

        // imperative
        if (that.next){
        	return that.next.done.call(that.next, res);
        }

        // conditional
        if (that.nextTrue){
        	return res ? 
        		that.nextTrue.done.call(that.nextTrue, res) : 
        		that.nextFalse.done.call(that.nextFalse, res);
        }

     }

  }

  Promise.prototype.all = function(promises){

		// the results of all the evaluations
		var promiseCountdown = promises.length;
		var startedAll = false;
		var results = new Array( promiseCountdown );

  	promises.forEach(function(p, i){

  		var index = i;

  		p.then(function(res){

  			// running one promise causes the execution of all of them
  			if (!startedAll){
	  			for (var j = 1; j < promises.length; j++){
	  				promises[j].done();
	  			} 
  			}

  			results[index] = res;

  			promiseCountdown--;

  			if (promiseCountdown != 0){
  				this.cancel();
  				return res;
  			}

  			return results;

  		});

  	});

  	return promises[ 0 ];

  }

	// Env
	// A dictionary of symbol-value pairs
	var Env = function(vars, args, outer){

		vars = typeof vars !== 'undefined' ? vars : [];
		this.scope = {};
		var that = this;
		vars.forEach(function(val, i) {
			that.scope[val] = args[i];
		});
		outer = typeof outer !== 'undefined' ? outer : null;
		this.outer = outer;

		this.find = function(key){
			return this.scope[key] != null ? this.scope: this.outer.find(key);
		};

		this.add_methods = function(object) {
			var that = this;
			Object.getOwnPropertyNames(object).forEach(function(ele){
				if (typeof object[ele] === "function"){
					that.scope[ele] = object[ele];
				}
			});
		};

	};

	// The built-in symbols in the global Env
	var built_ins = {
		'+': function(x, y) { return x + y; },
		'-': function(x, y) { return x - y; },
		'*': function(x, y) { return x * y; },
		'/': function(x, y) { return x / y; },
		'<': function(x, y) { return x < y; },
		'<=': function(x, y) { return x <= y; },
		'>': function(x, y) { return x > y; },
		'>=': function(x, y) { return x >= y; },
		'%': function(x, y) { return x % y; },
		'length': function(x) { return x.length; },
		'cons': function(l, val) { l.push(val); return l; },
		'car': function(l) { return l[0]; },
		'cdr': function(l) { return l.slice(1); },
		'list': function() { return Array.prototype.slice.call(arguments, 0); },
		'list?': function(e) { return e instanceof Array; },
		'null?': function(e) { return e === []; },
		'symbol?': function(e) { return typeof e === "string"; },
		'pick': function(i, l) { 
			return l[i]; 
		},
		'map': function(f, l) { return l.map(f); },
		'reduce': function(f, a, l) { return l.reduce(f, a); },
		'filter': function(f, l) { return l.filter(f); },
		'reverse': function(l) { return l.reverse(); },
		'sort': function(l, f) { return l.sort(f); },
	}

	function add_globals(env) {
		env.add_methods(Math);
		env.add_methods(built_ins);
		return env;
	}

	// Interpreter
	// Evaluates S-expressions
	var Interpreter = function(){

		this.global_env = add_globals( new Env() );

		this.parse_eval = function(exp){
			return this.eval( this.parse(exp) );
		}


		this.async = function(x, env) {

			env = typeof env !== 'undefined' ? env : this.global_env;

			var that = this;

			if ( typeof x === "string") {							// variable reference

				return new Promise(function(){ return env.find(x)[x]; });

				// return env.find(x)[x]; 

			} else if ( !(x instanceof Array) ){					// literal	

				return new Promise(function(){ return x; });

				// return x; 

			} else if (x[0] === "quote") {							// (quote exp)

				return new Promise(function(){ return x[1]; });		
						
				// return x[1];

			} else if (x[0] === "if") {								// (if test conseq alt)

				var test = x[1], conseq = x[2], alt = x[3];
		    // return this.eval( (this.eval(test, env) ? conseq : alt), env );

		    return that.async(test, env).test( that.async(conseq, env), that.async(alt, env) );

			} else if (x[0] === "set!") {							// (set! var exp)

				var vari = x[1], exp = x[2];
				// env.find(vari)[vari] = this.eval(exp); 

				return that.async( exp, env ).then(function(val){
					env.find(vari)[vari] = val;
				});

			} else if (x[0] === "define") { 						// (define var exp)

				var vari = x[1], exp = x[2];

				return that.async( exp, env ).then(function(val){
					env.scope[vari] = val;
				});

				// env.scope[vari] = this.eval(exp, env);

			} else if (x[0] === "lambda") {							// (lambda (var*) exp)

				var vars = x[1], exp = x[2];

				// todo

				return (function(args) {
					return that.eval( exp, new Env(vars, arguments, env) );
				});


			} else if (x[0] === "begin") {							// (begin exp*)

				// do all individually
				var f = that.async( x[1], env );

				for (var i = 2, l = x.length; i < l; i++) {

					f.then( that.async( x[i], env ) );

					// f = this.eval( x[i] );
				}

				return f;

			} else {												// (proc exp*)

				var proc = this.async( x[0] );

				var promises = [];

				for (var i = 1; i < x.length; i++){

					var index = i;
					var promise = this.async( x[i], env );

					promises.push( promise );

				}

			 	var resultsPromise = Promise.all( promises );

			 	return resultsPromise.then( proc );

				// var that = this;  		

				// var exps = x.map(function(exp) { 					
				// 	return that.eval(exp, env);
				// });

			 //  var proc = exps.shift();
			 //  return proc.apply(this, exps);
			}

		}

		// for each - go go go - when all results are collected - continue


		this.async_eval = function(x, env){

			return this.async(x, env).go();

		}


		this.eval = function(x, env) {
			env = typeof env !== 'undefined' ? env : this.global_env;

			var that = this;
			if ( typeof x === "string") {							// variable reference
				return env.find(x)[x];
			} else if ( !(x instanceof Array) ){					// literal	
				return x; 
			} else if (x[0] === "quote") {							// (quote exp)
				return x[1];
			} else if (x[0] === "if") {								// (if test conseq alt)
				var test = x[1], conseq = x[2], alt = x[3];
		    return this.eval( (this.eval(test, env) ? conseq : alt), env );
			} else if (x[0] === "set!") {							// (set! var exp)
				var vari = x[1], exp = x[2];
				env.find(vari)[vari] = this.eval(exp); 
			} else if (x[0] === "define") { 						// (define var exp)
				var vari = x[1], exp = x[2];
				env.scope[vari] = this.eval(exp, env);
			} else if (x[0] === "lambda") {							// (lambda (var*) exp)
				var vars = x[1], exp = x[2];
				return (function(args) {
					return that.eval( exp, new Env(vars, arguments, env) );
				});
			} else if (x[0] === "begin") {							// (begin exp*)
				var f;
				for (var i = 1, l = x.length; i < l; i++) {
					f = this.eval( x[i] );
				}
				return f;
			} else {												// (proc exp*)
				var that = this;									
				var exps = x.map(function(exp) { 					
					return that.eval(exp, env);
				});
			  var proc = exps.shift();
			  return proc.apply(this, exps);
			}

		}

		this.parse = function(s) {
			return this.read_from( this.tokenize( s ) );
		}

		this.tokenize = function(s) {
			return s.replace(/\(/g," ( ").replace(/\)/g," ) ").split(" ").filter(function(e){ return e; });
		};

		this.read_from = function(tokens) {
			if (tokens.length === 0) throw "unexpected EOF";
			token = tokens.shift();
			if (token === "(") {
				var L = [];
				while (tokens[0] !== ")") {
					L.push( this.read_from( tokens ) );
				}
				tokens.shift();
				return L;
			} else if (token === ")") {
				throw "expected )";
			} else {
				return this.atom(token);
			}
		};

		this.atom = function(token){
			var t = parseFloat( token );
			return isNaN(t) ? token : t;
		};

	};

	if ( typeof exports != 'object' || exports === undefined )  // browser context
	{
		if (!scheme) var scheme = {};
		scheme.Interpreter = Interpreter;
		scheme.Env = Env;
		return scheme;
	}
	else // node.js context
	{
		// Export these objects 
		exports.Interpreter = Interpreter;
		exports.Env = Env;
		return exports;

	}

});







