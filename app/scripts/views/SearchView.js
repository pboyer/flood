define(['backbone', 'List', 'SearchElementView'], function(Backbone, List, SearchElementView) {

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

      this.app.SearchElements.forEach(function(ele) {

        var eleView = new SearchElementView({ model: ele }, { app: that.app });
        eleView.elementClick = that.elementClick;

        eleView.render();
        that.$list.append( eleView.$el );

      });

      var options = {
          valueNames: [ 'name' ]
      };

      this.list = new List(this.el, options);

    },

    elementClick: function(e){
      this.model.app.addNodeToWorkspace( this.model.get('name') );
      this.model.app.set('showingSearch', false);
    },

    searchKeyup: function(event) {

      if ( event.keyCode === 13) { // enter key causes first result to be inserted
        var nodeName = this.$list.find('.search-element').first().find('.name').first().html();
        this.app.addNodeToWorkspace( nodeName );
      } else if ( event.keyCode === 27) { // esc key exits search
        this.app.set('showingSearch', false);
      }
    } 

  });

});

