define(['backbone', 'underscore', 'jquery', 'BaseNodeView'], function(Backbone, _, $, BaseNodeView) {

  return BaseNodeView.extend({

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);

    },

    innerTemplate : _.template( $('#node-formula-template').html() ),

    render: function() {

      BaseNodeView.prototype.render.apply(this, arguments);

      var js = this.model.toJSON() ;
      if (!js.extra.script) js.extra.script = this.model.get('type').script;

      this.$el.find('.node-data-container').html( this.innerTemplate( js ) );

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

    }

  });

});