define(['backbone', 'Nodes', 'Connection', 'Connections', 'scheme', 'FLOOD'], function(Backbone, Nodes, Connection, Connections, scheme, FLOOD) {

  return Backbone.Model.extend({

    idAttribute: "_id",

    defaults: {
      name: "WorkspaceName",
      nodes: null,
      connections: null,
      selectedNodes: new Nodes(),
      zoom: 1,
      current: false
    },

    draggingProxy: false,
    proxyConnection: null,
    runAllowed: false,

    initialize: function(atts, arr) {

      atts = atts || {};

      this.app = arr.app;

      this.set('nodes', new Nodes( atts.nodes, { workspace: this }) );
      this.set('connections', new Connections( atts.connections, { workspace: this}) );

      // tell all nodes about connections
      _.each( this.get('connections').where({startProxy: false, endProxy: false}), function(ele, i) {
        this.get('nodes').get(ele.get('startNodeId')).connectPort( ele.get('startPortIndex'), true, ele);
        this.get('nodes').get(ele.get('endNodeId')).connectPort(ele.get('endPortIndex'), false, ele);
      }, this);

      // updates to connections and nodes are emitted to listeners
      var that = this;
      this.get('connections').on('add remove', 
        function(){ 
          that.trigger('change'); 
      });

      this.get('nodes').on('add remove', function(){ 
        that.run();
        that.trigger('change'); 
      });

      this.proxyConnection = new Connection({
        _id: -1, 
        startProxy: true, 
        endProxy: true, 
        startProxyPosition: [0,0], 
        endProxyPosition: [0,0],
        hidden: true }, 
      {workspace: this});

      this.runAllowed = true;

      this.run();

      this.on('change', this.printModel, this);

      // need custom event on Workspace model to update the proxyConnectionView
    },

    parse : function(resp) {
      resp.nodes = new Nodes( resp.nodes );
      resp.connections = new Connections( resp.connections )
      return resp;
    },

    printModel: function(){
      console.log(this.toJSON());
    },

    startProxyConnection: function(startNodeId, nodePort, startPosition) {

      // set the initial properties for a dragging proxy
      this.proxyConnection.set('hidden', false);
      this.proxyConnection.set('startNodeId', startNodeId);
      this.proxyConnection.set('startPortIndex', nodePort );

      this.proxyConnection.set('startProxy', false );

      this.proxyConnection.set('endProxy', true );
      this.proxyConnection.set('endProxyPosition', startPosition);

      this.draggingProxy = true;
      // alert the view that we are now dragging
      this.trigger('startProxyDrag');
      return this;
    },

    completeProxyConnection: function(endNode, endPort) {

      this.trigger('endProxyDrag');

      // this is where we started drawing the connection
      var startNodeId = this.proxyConnection.get('startNodeId')
        , startPort = this.proxyConnection.get('startPortIndex');

      this.makeConnection(startNodeId, startPort, endNode, endPort);
      this.draggingProxy = true;
      return this;
    },

    run: function() {

      if (!this.runAllowed || this.get('nodes').length === 0)
        return;

      // get all nodes with output ports
      var S = new scheme.Interpreter()
        , baseNode = null
        , bottomNodes = this.get('nodes').filter(function(ele){
                                return ele.isOutputNode();
                              }).map(function(ele){
                                return ele.get('type');
                              }).map(function(type){
                                return type.outputs[0];
                              });


      // if more than one output, make a begin node
      if ( bottomNodes.length > 1) {
        baseNode = new FLOOD.nodeTypes.Begin();
        var count = 0;
        bottomNodes.forEach( function(output){ 
          baseNode.inputs.push( output.asInputPort(baseNode, count++) ); 
          baseNode.inputs[baseNode.inputs.length-1].connect( output.parentNode );
        });
      } else if (bottomNodes.length == 1) {
        baseNode = bottomNodes[0].parentNode;
      }

      console.log( baseNode.printExpression() );

      if (baseNode){
        baseNode.markDirty();
        S.eval( baseNode.compile() );
      }

    },

    endProxyConnection: function() {
      this.proxyConnection.set('hidden', true);
      this.draggingProxy = true;
      return this;
    },

    makeNode : function(type, name, position) {
      var node = new Node({name: name, type: type, position: position})
      this.get('nodes').add( node );
      return this;
    },

    removeConnection : function(connection){
      this.get('connections').remove(connection);
    },

    makeConnection : function(startNodeId, startPort, endNodeId, endPort) {

      if (!this.validateConnection(startNodeId, startPort, endNodeId, endPort)){
        return;
      }

      // type validation here
      var newCon = new Connection({
          startNodeId: startNodeId,
          startPortIndex: startPort,
          endNodeId: endNodeId,
          endPortIndex: endPort,
          _id: this.app.makeId()
        }, {workspace: this});

      // update the start and end nodes
      this.get('connections').add(newCon);

      this.get('nodes').get(newCon.get('startNodeId')).connectPort( newCon.get('startPortIndex'), true, newCon);
      this.get('nodes').get(newCon.get('endNodeId')).connectPort(newCon.get('endPortIndex'), false, newCon);

      return this;
    },

    validateConnection: function(startNodeId, startPort, endNodeId, endPort) {

      var startNode = this.get('nodes').get(startNodeId)
        , endNode = this.get('nodes').get(endNodeId);

      if (endNode.isPortConnected(endPort, false))
        return false;

      return true;

    }

  });

});



