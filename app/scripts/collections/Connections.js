define(['backbone', 'Connection'], function(Backbone, Connection) {

	return Backbone.Collection.extend({

		model: Connection

	});

});

