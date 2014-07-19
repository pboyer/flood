define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

		idAttribute: "_id",

    defaults: {
      name: "Unnamed Workspace",
      isPublic: false,
      isCustomNode: false,
      lastSaved: Date.now()
    },

	  initialize: function(atts, vals) {

	  }

	});
});