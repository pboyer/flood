define(['backbone'], function(Backbone) {

  return Backbone.Model.extend({

    idAttribute: "_id",

    defaults: {
      x: 10
      , y: 10
      , width: 50
      , height: 50
      , hidden: true
    },

    startCorner: [10,10],

    endCorner: [20, 20],

    initialize: function(args, options){

      this.workspace = options.workspace;

    },

    updateRawValues: function(){

      this.set('width', Math.abs( this.startCorner[0] - this.endCorner[0] ) );
      this.set('height', Math.abs( this.startCorner[1] - this.endCorner[1] ) );
      this.set('x', Math.min( this.startCorner[0], this.endCorner[0] ) );
      this.set('y', Math.min( this.startCorner[1], this.endCorner[1] ) );

    },

    setStartCorner: function( posInWorkspace ){

      this.startCorner = posInWorkspace;
      this.endCorner = posInWorkspace;

      this.updateRawValues();

    },

    setEndCorner: function( posInWorkspace ){

      this.endCorner = posInWorkspace;

      this.updateRawValues();

    }

  });

});
