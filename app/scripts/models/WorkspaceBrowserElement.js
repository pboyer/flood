define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

		idAttribute: "_id",

    defaults: {
      name: "Unnamed Workspace",
      zoom: 1,
      current: false,
      isPublic: false,
      lastSaved: Date.now()
    },

	  initialize: function(atts, vals) {

	  }

	});
});