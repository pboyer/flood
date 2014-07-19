define(['backbone', 'WorkspaceBrowserElementView'], function(Backbone, WorkspaceBrowserElementView) {

  return Backbone.View.extend({

    el: '#workspace-browser',

    initialize: function(atts, arr) {
      this.app = arr.app;

      this.model.get('workspaces').on('reset', this.render, this );
      this.model.get('workspaces').on('add', this.addWorkspace, this );
      this.model.get('workspaces').on('remove', this.removeWorkspace, this );

      this.render();
    },

    template: _.template( $('#workspace-browser-template').html() ),

    events: { 
      'click #refresh-workspace-browser': "refreshClick",
      'click #workspace-browser-custom-nodes-header': "customNodeHeaderClick",
      'click #workspace-browser-projects-header': "projectHeaderClick"
    },

    render: function(arg) {

      this.$el.html( this.template( this.model.toJSON() ) );

      this.contents = this.$el.find('#workspace-browser-contents');

      this.customNodes = this.$el.find('#workspace-browser-custom-nodes');
      this.customNodes.empty();

      this.projects = this.$el.find('#workspace-browser-projects');
      this.projects.empty();

    },

    refreshClick: function(){
      this.model.refresh();
    },

    addWorkspace: function(x){

      if (!this.contents) this.render();

      console.log(x)

      var v = new WorkspaceBrowserElementView( { model: x }, { app : this.app } );
      v.render();

      if ( x.get('isCustomNode') ){
        this.customNodes.append( v.$el );
      } else {
        this.projects.append( v.$el );
      }
      
    }, 

    removeWorkspace: function(ws){

      if (!this.contents) return;
      this.contents.find('.workspace-browser-element[data-id*=' + ws.get('_id') + ']').remove();

    }

  });

});

