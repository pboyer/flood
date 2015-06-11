define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

	  defaults: {
	  	isProjectWorkspace: false,
	  },

	  initialize: function(atts, vals) {

	  	this.app = atts.app;

	  	// this.app.on('change:currentWorkspace', function(x){
	  	// 	console.log( this.app.getCurrentWorkspace() );
	  	// }, this);

	  },

	});

});