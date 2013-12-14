define(['backbone', 'underscore', 'jquery', 'BaseNodeView'], function(Backbone, _, $, BaseNodeView) {

  return BaseNodeView.extend({

    template: _.template( $('#node-num-template').html() ),

    watchEvents: {  'click .node-number-input': 'inputFocused',
                    'change .node-number-input': 'inputChanged' },

    initialize: function(args) {
      BaseNodeView.prototype.initialize.apply(this, arguments);
      this.events = _.extend( {}, this.events, this.watchEvents );
    },

    inputFocused: function(e) {
      this.workspace.get('nodes').deselectAll();
      this.$el.find('.node-number-input').focus();
      e.stopPropagation();
    },

    inputChanged: function(e) {

      var inputVal = this.$el.find('.node-number-input').val()
        , val = parseFloat( inputVal )
        , val = isNaN(val) ? 0 : val;

      this.$el.find('.currentValue').html(val);

      this.model.get('type').value = val;
      this.model.get('type').setDirty();
      this.model.workspace.run();

    }

  });

});