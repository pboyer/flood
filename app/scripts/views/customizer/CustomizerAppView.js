// the application is constituted by

// CustomizerAppView, CustomizerApp - controls visibility of widget
// CustomizerWorkspaceView - collection of node widgets, similar to a nodeview, includes mask for which widgets will be visible
// CustomizerNodeView - similar to a nodeview, but no inputs/outputs, simplified controls, potentially multiple options with labels
// CustomizerViewer - allows you to view your customized geometry, with saved camera position

define(['backbone', 'CustomizerViewerView', 'CustomizerHeaderView', 'CustomizerWorkspaceView'],
  function(Backbone, CustomizerViewer, CustomizerHeaderView, CustomizerWorkspaceView ) {

  'use strict';

  return Backbone.View.extend({

    el: '#customizer-app ',

    events: {  },

    initialize: function( args, atts ) {
      this.listenTo(this.model, 'change', this.render);
    },

    render: _.once(function() {

      (new CustomizerViewer()).render();
      var hv = new CustomizerHeaderView({model: this.model.getCurrentWorkspace() })
      this.listenTo( hv, "download-stl", function(){ this.model.getCurrentWorkspace().exportSTL() } );;
      hv.render();
      (new CustomizerWorkspaceView({model: this.model.getCurrentWorkspace() })).render();

      return this;

    }),

  });
});
