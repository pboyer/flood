define(['underscore', 'jquery', 'ThreeCSGNodeView'], function(_, $, ThreeCSGNodeView) {

  return ThreeCSGNodeView.extend({

    innerTemplate : _.template( $('#node-custom-template').html() ),

    getCustomContents: function() {

      var that = this;

      // open the parent workspace on double click
      this.$el.bind('dblclick', function(){
        this.model.workspace.app.openWorkspace( this.model.get('type').functionId );
      }.bind(this) );

      var js = this.model.toJSON() ;
      if (!js.extra.script) js.extra.script = this.model.get('type').script;

      return this.innerTemplate( js );

    }

  });

});