define(['backbone', 'SearchElement', 'FLOOD'], function(Backbone, SearchElement, FLOOD) {

	return Backbone.Collection.extend({

		model: SearchElement,

		initialize: function(atts) {
			this.app = atts.app;
		},

		addCustomNode: function(customNode){

			this.models.push(new SearchElement({name: customNode.functionName, functionName: customNode.functionName, 
				isCustomNode: true, functionId: customNode.functionId, app: this.app, numInputs: customNode.inputs.length, 
				numOutputs: customNode.outputs.length }));

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

