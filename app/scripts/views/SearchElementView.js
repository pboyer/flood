define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    tagName: 'li',
    className: 'search-element',

    template: _.template( $('#search-element-template').html() ),

    events: {
      'click':  'click'
    },

    initialize: function(a, arr){
      this.app = arr.app;
      this.appView = arr.appView;
    },

    render: function() {
      this.$el.html( this.template( this.model.toJSON() ) );
    },

    click: function(e) {
      this.elementClick.call(this, e);
    }

  });

});