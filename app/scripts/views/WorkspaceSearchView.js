define(['backbone', 'List', 'SearchElementView'], function(Backbone, List, SearchElementView) {

  return Backbone.View.extend({

    tagName: 'div',
    className: 'workspace-search',

    initialize: function(atts, arr) {
      this.app = arr.app;
    },

    template: _.template( $('#workspace-search-template').html() ),

    events: {
      'keyup .library-search-input': 'searchKeyup',
      'focus .library-search-input': 'focus',
      'blur .library-search-input': 'blur'
    },

    render: function(arg) {

      this.$el.html( this.template( this.model.toJSON() ) );

      this.$input = this.$('.library-search-input');
      this.$list = this.$('.search-list');

      this.$list.empty();

      var that = this;

      this.app.SearchElements.forEach(function(ele) {

        var eleView = new SearchElementView({ model: ele });
        eleView.elementClick = that.elementClick;

        eleView.render();
        that.$list.append( eleView.$el );

      });

      var options = {
          valueNames: [ 'name' ]
      };

      this.list = new List(this.el, options);

    },

    focus: function(event){
      this.$('.search-list').show();
      this.$('.library-search-input').select();
    },

    blur: function(event){
      var that = this;
      window.setTimeout(function(){
        that.$('.search-list').hide();
      }, 100);
    },

    elementClick: function(e){
      this.model.app.addNodeToWorkspace( this.model.get('name') );
      this.model.app.set('showingSearch', false);
    },

    searchKeyup: function(event) {

      if ( event.keyCode === 13) { // enter key causes first result to be inserted
        var nodeName = this.$list.find('.search-element').first().find('.name').first().html();
        this.app.addNodeToWorkspace( nodeName );
      } 

    } 

  });

});

