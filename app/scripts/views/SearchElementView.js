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
      this.elementClick = arr.click;
    },

    render: function() {
      this.$el.html( this.template( this.model.toJSON() ) );
    },

    click: function(e) {
      if (!this.elementClick) return;
      this.elementClick(this);
    }

  });

});