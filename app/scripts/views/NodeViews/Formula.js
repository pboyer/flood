define(['backbone', 'underscore', 'jquery', 'BaseNodeView', 'FLOOD'], function(Backbone, _, $, BaseNodeView, FLOOD) {

  return BaseNodeView.extend({

    initialize: function(args) {
      BaseNodeView.prototype.initialize.apply(this, arguments);
      this.model.on('change:extra', this.onChangedExtra, this);
    },

    innerTemplate : _.template( $('#node-formula-template').html() ),

    getCustomContents: function() {

      var js = this.model.toJSON() ;
      if (!js.extra.script) js.extra.script = this.model.get('type').script;

      return this.innerTemplate( js );

    },

    onChangedExtra: function(){

      var ex = this.model.get('extra') || {};

      if (ex.numInputs != undefined ){
        this.setNumInputConnections( ex.numInputs )
        this.model.get('type').setNumInputs( ex.numInputs );
      }

    	this.render();
    	this.model.trigger('updateRunner');
		  this.model.workspace.run();
    },

    setNumInputConnections: function(num){

      if (num === undefined) return;

      var inputConns = this.model.get('inputConnections');

      var diff = num - inputConns.length;

      if (diff === 0) return;

      if (diff > 0){
        for (var i = 0; i < diff; i++){
          inputConns.push([]);
        }
      } else {
        for (var i = 0; i < -diff; i++){

          var conn = this.model.getConnectionAtIndex(inputConns.length - 1);

          if (conn != null){
            this.model.workspace.removeConnection(conn);
          }

          inputConns.pop();
        }

      }

    },

    renderNode: function() {

    	BaseNodeView.prototype.renderNode.apply(this, arguments);

      this.input = this.$el.find('.formula-text-input');

      var that = this;

      this.input.focus(function(e){ 
      	that.selectable = false;
      	that.model.set('selected', false);
      	e.stopPropagation();
      });

      this.input.blur(function(){ 

      	var ex = JSON.parse( JSON.stringify( that.model.get('extra') ) );
      	if ( ex.script === that.input.val() ) return;

      	ex.script = that.input.val();

      	that.model.workspace.setNodeProperty({property: "extra", _id: that.model.get('_id'), newValue: ex });
      	that.selectable = true; 
      });

      this.$el.find('.add-input').click(function(){ that.addInput.call(that); });
      this.$el.find('.remove-input').click(function(){ that.removeInput.call(that); });

      return this;

    },

    setNumInputsProperty: function(numInputs){
      if (numInputs === undefined) return;

      var ex = this.model.get('extra');
      var exCopy = JSON.parse( JSON.stringify( ex ) );
      
      exCopy.numInputs = numInputs;
      this.model.workspace.setNodeProperty({property: "extra", _id: this.model.get('_id'), newValue: exCopy, oldValue: ex });
    },

    addInput: function(){

    	var type = this.model.get('type');
      var ex = this.model.get('extra');
  	  var numInputs = ex.numInputs;

  	  if (numInputs === undefined) numInputs = 0;
  	  if (type.inputs.length === 26) return;

      this.setNumInputsProperty(numInputs + 1);

    },

    removeInput: function(){

    	var type = this.model.get('type');
      var ex = this.model.get('extra');
  	  var numInputs = ex.numInputs;

  	  if (numInputs === undefined) numInputs = 1;
  	  if (type.inputs.length === 0) return;

      this.setNumInputsProperty(numInputs - 1);

    }

  });

});