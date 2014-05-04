define(['backbone', 'WorkspaceBrowserElement'], function(Backbone, WorkspaceBrowserElement) {

	return Backbone.Collection.extend({

    url: '/ws',
		model: WorkspaceBrowserElement

	});

});