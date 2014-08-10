define(['backbone', 'underscore', 'jquery', 'BaseNodeView'], function(Backbone, _, $, BaseNodeView) {

  return BaseNodeView.extend({

    template: _.template( $('#node-output-template').html() ),

    renderNode: function(){

    	var res = BaseNodeView.prototype.renderNode.apply(this, arguments);

      var that = this;
      this.$el.find(".output-text-input").blur(function(){ that.textChanged.call(that); })

      return res;

    },

    textChanged: function(){

      this.model.workspace.trigger('updateRunner');
      
    }

  });

});
