define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

		  defaults: {
		  	isLoggedIn : false,
		  	loginFail : false
		  },

  		  initialize: function(atts, vals) {
  		  	this.app = vals.app;
		  },

		  signup: function(data){
		  	var that = this;
		  	$.get('/logout', data, function(e){
		  		that.app.fetch();
		  	});
		  }

		  login: function(data){

		  	var that = this;
		  	$.post('/login', data, function(e){
		  		that.app.fetch();
		  	});

		  },

		  logout: function(data){
		  	var that = this;
		  	$.get('/logout', data, function(e){
		  		that.app.fetch();
		  	});
		  }

	});
});



