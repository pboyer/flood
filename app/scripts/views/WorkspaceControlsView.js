define(['backbone', 'List', 'SearchElementView', 'bootstrap', 'jquery'], function(Backbone, List, SearchElementView, bootstrap, $) {

  return Backbone.View.extend({

    tagName: 'div',
    className: 'workspace-search',

    initialize: function(atts, arr) {
      this.app = arr.app;
      this.appView = arr.appView;

      this.app.SearchElements.on('add remove', this.render, this);
    },

    template: _.template( $('#workspace-search-template').html() ),

    events: {
      'keyup .library-search-input': 'searchKeyup',
      'focus .library-search-input': 'focus',
      'blur .library-search-input': 'blur',
      'click #delete-button': 'deleteClick',
      'click #undo-button': 'undoClick',
      'click #redo-button': 'redoClick',
      'click #copy-button': 'copyClick',
      'click #paste-button': 'pasteClick',
      'click #zoomin-button': 'zoominClick',
      'click #zoomout-button': 'zoomoutClick',
      'click #zoomreset-button': 'zoomresetClick',
      'click #export-button': 'exportClick'
    },

    render: function(arg) {

      this.$el.html( this.template( this.model.toJSON() ) );

      this.$input = this.$('.library-search-input');
      this.$list = this.$('.search-list');

      // highlight text in the search input when focussed
      this.$input.focus(function(){ this.select(); });

      this.$list.empty();

      var that = this;

      this.app.SearchElements.forEach(function(ele) {

        var eleView = new SearchElementView({ model: ele }, { appView: that.appView, app: that.app, 
          click: function(e){ that.elementClick.call(that, e); } 
        });

        eleView.render();
        that.$list.append( eleView.$el );

      });

      var options = {
          valueNames: [ 'name' ]
      };

      this.list = new List(this.el, options);

      // build button tooltips
      this.$el.find('#undo-button').tooltip({title: "Undo"});
      this.$el.find('#redo-button').tooltip({title: "Redo"});

      this.$el.find('#copy-button').tooltip({title: "Copy"});
      this.$el.find('#paste-button').tooltip({title: "Paste"});

      this.$el.find('#delete-button').tooltip({title: "Delete"});

      this.$el.find('#zoomin-button').tooltip({title: "Zoom in"});
      this.$el.find('#zoomout-button').tooltip({title: "Zoom out"});
      this.$el.find('#zoomreset-button').tooltip({title: "Zoom fit"});

      this.$el.find('#export-button').tooltip({title: "Export as STL"});

      $('#workspace_hide').tooltip({title: "Switch between 3D view and nodes"});
      
      $('#help-button').tooltip({title: "Help", placement: "left"});
      $('#feedback-button').tooltip({title: "Feedback", placement: "left"});
      $('#share-button').tooltip({title: "Share", placement: "left"});

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

    deleteClick: function(){
      this.app.getCurrentWorkspace().removeSelected();
    },

    copyClick: function(){
      this.app.getCurrentWorkspace().copy();
    },

    pasteClick: function(){
      this.app.getCurrentWorkspace().paste();
    },

    undoClick: function(){
      this.app.getCurrentWorkspace().undo();
    },

    redoClick: function(){
      this.app.getCurrentWorkspace().redo();
    },

    zoomresetClick: function(){
      this.appView.currentWorkspaceView.zoomAll();
    },

    zoominClick: function(){
      this.app.getCurrentWorkspace().zoomIn();
    },

    zoomoutClick: function(){
      this.app.getCurrentWorkspace().zoomOut();
    },

    addNode: function(name){

      if (name === undefined ) return;
      this.app.getCurrentWorkspace().addNodeByNameAndPosition( name, this.appView.getCurrentWorkspaceCenter() );

    },

    exportClick: function(e){

      this.app.getCurrentWorkspace().exportSTL();

    },

    elementClick: function(ele){

      this.addNode( ele.model.get('name') );

    },

    searchKeyup: function(event) {

      // enter key causes first result to be inserted
      if ( event.keyCode === 13) {

        var nodeName = this.$list.find('.search-element').first().find('.name').first().html();
        if (nodeName === undefined ) return;

        this.addNode( nodeName );

      } 

    } 

  });

});

