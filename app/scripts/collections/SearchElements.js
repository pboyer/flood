define(['backbone', 'SearchElement', 'FLOOD'], function(Backbone, SearchElement, FLOOD) {

	return Backbone.Collection.extend({

		model: SearchElement,

		initialize: function(atts) {
			this.app = atts.app;
		},

		addCustomNode: function(customNode){

			var match = this.where({ functionId: customNode.functionId });
			if (match) this.remove( match );

			this.add(new SearchElement({name: customNode.functionName, functionName: customNode.functionName, 
				isCustomNode: true, functionId: customNode.functionId, app: this.app, numInputs: customNode.inputs.length, 
				numOutputs: customNode.outputs.length }));

		},

		fetch: function() {

			this.models.length = 0;

			for (var key in FLOOD.nodeTypes){
				this.models.push( new SearchElement({name: key, app: this.app}) );	
			}

		}

	});
});

