define(['backbone', 'WorkspaceBrowserElements'], function(Backbone, WorkspaceBrowserElements) {

	return Backbone.Model.extend({

	  defaults: {
      workspaces: new WorkspaceBrowserElements()
	  },

	  initialize: function(atts, vals) {
	  	this.get('workspaces').fetch();
	  }

	});
});