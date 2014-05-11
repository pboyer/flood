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
      this.input.focus(function(){ that.selectable = false; });

      this.input.blur(function(){ 
      	var ex = that.model.get('extra');
      	ex.script = that.input.val();
      	that.model.set('extra', ex);
      	that.selectable = true; 
		    that.model.trigger('updateRunner');
		    that.model.workspace.run();
      });

      this.$el.find('.add-input').click(function(){ that.addInput.call(that); });
      this.$el.find('.remove-input').click(this.removeInput);

    },

    addInput: function(){

    	var type = this.model.get('type');
    	type.inputs.push( new FLOOD.baseTypes.InputPort( "B", [Number], 0 ) );
    	
    	this.render();  // need to check the ports in some way

    },

    removeInput: function(){
    	console.log('ho')
    }

  });

});