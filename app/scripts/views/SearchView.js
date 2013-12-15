define(['backbone', 'List', 'LibraryElementView'], function(Backbone, List, LibraryElementView) {

  return Backbone.View.extend({

    tagName: 'div',
    className: 'search-container row',

    initialize: function(atts, arr) {
      this.app = arr.app;
    },

    template: _.template( $('#search-template').html() ),

    events: {
      'keyup .library-search-input': 'searchKeyup'
    },

    render: function(arg) {

      this.$el.html( this.template( this.model.toJSON() ) );

      this.$input = this.$('.library-search-input');
      this.$list = this.$('.search-list');

      this.$list.empty();

      var that = this;

      this.app.LibraryElements.forEach(function(ele) {

        var eleView = new LibraryElementView({ model: ele });

        eleView.render();
        that.$list.append( eleView.$el );

      });

      var options = {
          valueNames: [ 'name' ]
      };

      this.list = new List(this.el, options);

    },

    searchKeyup: function(event) {

      if ( event.keyCode === 13) { // enter key causes first result to be inserted

        var nodeName = this.$list.find('.search-element').first().find('.name').first().html();
        this.app.addNodeToWorkspace( nodeName );

      } else if ( event.keyCode === 27) { // esc key exits search

        this.app.set('searching', false);

      }
    } 

  });

});

