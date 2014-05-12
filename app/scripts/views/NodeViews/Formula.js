define(['backbone', 'underscore', 'jquery', 'BaseNodeView', 'FLOOD'], function(Backbone, _, $, BaseNodeView, FLOOD) {

  return BaseNodeView.extend({

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);

    },

    innerTemplate : _.template( $('#node-formula-template').html() ),

    getCustomContents: function() {

      var js = this.model.toJSON() ;
      if (!js.extra.script) js.extra.script = this.model.get('type').script;

      return this.innerTemplate( js );

    },

    render: function() {

    	BaseNodeView.prototype.render.apply(this, arguments);

      this.input = this.$el.find('.formula-text-input');

      var that = this;
      this.input.focus(function(e){ 
      	that.selectable = false;
      	that.model.set('selected', false);
      	e.stopPropagation();
      });

      this.input.blur(function(){ 
      	var ex = that.model.get('extra');
      	if ( ex.script === that.input.val() ) return;
      	ex.script = that.input.val();
      	that.model.set('extra', ex);
      	that.selectable = true; 
		    that.model.trigger('updateRunner');
		    that.model.workspace.run();
      });

      this.$el.find('.add-input').click(function(){ that.addInput.call(that); });
      this.$el.find('.remove-input').click(function(){ that.removeInput.call(that); });

    },

    addInput: function(){

    	// get model data
    	var type = this.model.get('type');
  	  var ex = this.model.get('extra');

  	  // sorry - no more letters!  hehe
  	  if (type.inputs.length === 26) return;

    	ex.numInputs = (ex.numInputs || 1) + 1;
    	this.model.set('extra', ex);
    	this.model.trigger('updateRunner');

    	type.setNumInputs( ex.numInputs );
    	this.render();  
    	this.workspace.run();

    },

    removeInput: function(){

    	// get model data
    	var type = this.model.get('type');
  	  var ex = this.model.get('extra');

  	  if (type.inputs.length === 0) return;

  	  // update runner
    	ex.numInputs = (ex.numInputs || 1) - 1;
    	this.model.set('extra', ex);
    	this.model.trigger('updateRunner');

    	// update ui

    	if ( this.model.isPortConnected( this.model.get('inputConnections').length - 1 ) ){
    		this.model.disconnectPort( this.model.get('inputConnections').length - 1 );
    	}

    	type.setNumInputs( ex.numInputs );
    	this.render();
    	this.workspace.run();

    }

  });

});