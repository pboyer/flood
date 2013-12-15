define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    el: '#help',

    template: _.template( $('#help-template').html() ),

    events: { "click .exit-help": 'hide' },

    initialize: function( args, atts ) {
      this.app = atts.app;
    },

    render: function() {

      this.$el.html( this.template( this.model.toJSON() ) );
      return this;

    },

    hide: function() {
      this.app.set('showingHelp', false);
    }

  });
});