define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

	  defaults: {
	  	isLoggedIn : false,
	  	loginFail : false,
	  	showing: false,
	  	email : ''
	  },

		initialize: function(atts, vals) {

	  	this.app = vals.app;

	  },

	  fetch : function(){

	  	var that = this;
	  	$.get('/email', function(e){
	  		if (e.email) {
	  			that.set('email', e.email);
	  			that.set('isLoggedIn', true); 
	  		} else {
	  			that.set('isLoggedIn', false);
	  		}
	  	});

	  },

		toggle: function(){

		  return this.get('showing') ? this.hide() : this.show();

		},

		show: function() {

		  this.set('showing', true);

		},

		hide: function() {

		  this.set('showing', false);

		},

	  signup: function(data){

	  	var that = this;
	  	$.post('/signup', data, function(e){
	  		that.app.fetch();
	  	});

	  },

	  login: function(data){

	  	var that = this;
	  	$.post('/login', data, function(e){
	  		that.app.fetch();
	  	});

	  },

	  logout: function(){

	  	var that = this;
	  	$.get('/logout', {}, function(e){
	  		that.app.fetch();
	  	});

	  }

	});
});
