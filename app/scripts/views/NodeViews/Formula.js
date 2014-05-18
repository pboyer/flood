define(['backbone', 'underscore', 'jquery', 'BaseNodeView', 'FLOOD'], function(Backbone, _, $, BaseNodeView, FLOOD) {

  return BaseNodeView.extend({

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);
      this.model.on('change:extra', this.updateChangedScript, this);

    },

    innerTemplate : _.template( $('#node-formula-template').html() ),

    getCustomContents: function() {

      var js = this.model.toJSON() ;
      if (!js.extra.script) js.extra.script = this.model.get('type').script;

      return this.innerTemplate( js );

    },

    updateChangedScript: function(){
    	this.render();
    	this.model.trigger('updateRunner');
		  this.model.workspace.run();
    },

    rendered: false,

    render: function() {

    	BaseNodeView.prototype.render.apply(this, arguments);

    	if (this.silentRender) return;

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

    },

    addInput: function(){

    	// get model data
    	var type = this.model.get('type');
  	  var ex = this.model.get('extra');

  	  if (ex.numInputs === undefined) ex.numInputs = 1;

  	  // sorry - no more letters!  hehe
  	  if (type.inputs.length === 26) return;

  	  this.model.get('inputConnections').push([]);

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

  	  if (ex.numInputs === undefined) ex.numInputs = 1;

  	  if (type.inputs.length === 0) return;

  	  // update runner
    	ex.numInputs = (ex.numInputs || 1) - 1;

    	// update ui
    	if ( this.model.isPortConnected( this.model.get('inputConnections').length - 1 ) ){
    		this.model.disconnectPort( this.model.get('inputConnections').length - 1 );
    	}

    	this.model.get('inputConnections').pop();

    	this.model.set('extra', ex);
    	this.model.trigger('updateRunner');

    	type.setNumInputs( ex.numInputs );
    	this.render();
    	this.workspace.run();

    }

  });

});