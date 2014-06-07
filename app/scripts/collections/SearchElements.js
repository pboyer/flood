define(['backbone', 'SearchElement', 'FLOOD'], function(Backbone, SearchElement, FLOOD) {

	return Backbone.Collection.extend({

		model: SearchElement,

		initialize: function(atts) {
			this.app = atts.app;
		},

		fetch: function() {

			// the models array has a single empty element at start (not sure why)
			this.models.length = 0;

			for (var key in FLOOD.nodeTypes){
				this.models.push( new SearchElement({name: key, app: this.app}) );	
			}

		}

	});
});

