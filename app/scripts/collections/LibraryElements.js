define(['backbone', 'LibraryElement', 'FLOOD'], function(Backbone, LibraryElement, FLOOD) {

	return Backbone.Collection.extend({

		model: LibraryElement,

		initialize: function(atts) {
			this.app = atts.app;
		},

		fetch: function() {

			for (var key in FLOOD.nodeTypes){
				this.models.push( new LibraryElement({name: key, app: this.app}) );
			}

		}

	});
});

