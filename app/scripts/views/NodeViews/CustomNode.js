define(['underscore', 'jquery', 'ThreeCSGNodeView'], function(_, $, ThreeCSGNodeView) {

  return ThreeCSGNodeView.extend({

    innerTemplate : _.template( $('#node-custom-template').html() ),

    getCustomContents: function() {

      var js = this.model.toJSON() ;
      if (!js.extra.script) js.extra.script = this.model.get('type').script;

      return this.innerTemplate( js );

    }

  });

});