define(['backbone'], function(Backbone) {

  return Backbone.Model.extend({

    idAttribute: "_id",

    defaults: {
      startNodeId: 0
      , endNodeId: 0
      , startPortIndex: 0
      , endPortIndex: 0
      , startProxy: false
      , endProxy: false
      , startProxyPosition: [0,0]
      , endProxyPosition: [0,0]
      , hidden: false
    },

    workspace : null,
    startNode: null,
    endNode: null,

    initialize: function(args, options){

      this.workspace = options.workspace;

      // proxyconnections bind to the proxyMove event on the workspace
      if ( args.startProxy || args.endProxy ) {
        this.workspace.bind('proxyMove', this.proxyMove, this);
      } else {

        // bind to end nodes
        this.startNode = this.workspace.get('nodes').get(args.startNodeId);
        this.endNode = this.workspace.get('nodes').get(args.endNodeId);

        var that = this;

        // watch the start and end node for removal
        this.startNode.on('removed', (function(){
          return function() {
            that.onNodeRemoved(true);
          };
        })());

        this.endNode.on('removed', (function(){
          return function() {
            that.onNodeRemoved(false);
          };
        })());

      }
      
      this.on('remove', this.onRemove);

    },

    onNodeRemoved: function(isStart){ 
      this.workspace.get('connections').remove(this);
    },

    onRemove: function(model, collection, options){
      
    },

    getOpposite: function(startNode){

      if ( startNode === this.startNode )
      {
        return {node: this.endNode, portIndex: this.get('endPortIndex')};
      }

      if ( startNode === this.endNode )
      {
        return {node: this.startNode, portIndex: this.get('startPortIndex')};
      }

      return {};

    }

  });

});
