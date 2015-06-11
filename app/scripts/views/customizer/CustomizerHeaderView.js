define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    el: '#customizer-header',

    template: _.template( $('#header-template').html() ),

    events: { "click .stl-download" : "downloadStl" },

    initialize: function( args, atts ) {
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {

      this.$el.html( this.template( this.model.toJSON() ) );
      return this;

    },

    downloadStl: function() {
        this.trigger("download-stl")
    }

  });
});
