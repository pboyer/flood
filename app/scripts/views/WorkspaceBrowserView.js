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

    },

    render: function(arg) {

      this.$el.html( this.template( this.model.toJSON() ) );

      this.contents = this.$el.find('#workspace-browser-contents');
      this.contents.empty();

    },

    addWorkspace: function(x){

      if (!this.contents) this.render();

      var v = new WorkspaceBrowserElementView( { model: x }, { app : this.app } );
      v.render();
      this.contents.append(v.$el);

    }, 

    removeWorkspace: function(ws){

      if (!this.contents) return;
      this.contents.find('.workspace-browser-element[data-id*=' + ws.get('_id') + ']').remove();

    }

  });

});

