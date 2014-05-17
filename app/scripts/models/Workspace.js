define(['backbone', 'Nodes', 'Connection', 'Connections', 'scheme', 'FLOOD', 'Runner', 'Node'], 
    function(Backbone, Nodes, Connection, Connections, scheme, FLOOD, Runner, Node) {

  return Backbone.Model.extend({

    idAttribute: "_id",

    defaults: {
      name: "Unnamed Workspace",
      nodes: null,
      connections: null,
      zoom: 1,
      current: false,
      isPublic: false,
      isRunning: false,
      lastSaved: Date.now(),

      // undo/redo stack
      undoStack: [],
      redoStack: []
    },

    draggingProxy: false,
    proxyConnection: null,
    runAllowed: false,

    initialize: function(atts, arr) {

      // event to ask user about leaving

      // var closeEditorWarning = function (){
      //     return 'It looks like you have been editing something -- if you leave before submitting your changes will be lost.'
      // }

      // window.onbeforeunload = closeEditorWarning

      atts = atts || {};

      this.app = arr.app;

      this.set('nodes', new Nodes( atts.nodes, { workspace: this }) );
      this.set('connections', new Connections( atts.connections, { workspace: this}) );

      // tell all nodes about connections
      _.each( this.get('connections').where({startProxy: false, endProxy: false}), function(ele, i) {
        this.get('nodes').get(ele.get('startNodeId')).connectPort( ele.get('startPortIndex'), true, ele);
        this.get('nodes').get(ele.get('endNodeId')).connectPort(ele.get('endPortIndex'), false, ele);
      }, this);

      this.runner = new Runner({id : this.get('_id') }, { workspace: this });

      // updates to connections and nodes are emitted to listeners
      var that = this;
      this.runner.on('change:isRunning', function(v){
        that.set('isRunning', v.get('isRunning'));
      });

      this.get('connections').on('add remove', function(){ 
        that.trigger('change:connections'); 
        that.run();
      });

      this.get('nodes').on('add remove', function(){ 
        that.trigger('change:nodes'); 
        that.run();
      });

      this.proxyConnection = new Connection({
        _id: -1, 
        startProxy: true, 
        endProxy: true, 
        startProxyPosition: [0,0], 
        endProxyPosition: [0,0],
        hidden: true }, 
      { workspace: this });

      this.runAllowed = true;

      // run the workspace for the first time
      this.run();

    },

    addToUndoAndClearRedo: function(cmd){

      this.get('undoStack').push(cmd);
      this.get('redoStack').length = 0;

    },  

    removeSelected: function(){

      // get all selected nodes
      var that = this;
      var nodeFound = false;
      var nodesToRemove = {};
      this.get('nodes')
          .each(function(x){ 
            if ( x.get('selected') ){
              nodeFound = true;
              nodesToRemove[ x.get('_id') ] = x.serialize();
            }
          });

      if (!nodeFound) return;

      // get all relevant connections
      var connsToRemove = {};
      this.get('connections')
        .each(function(x){
          if ( nodesToRemove[ x.get('startNodeId') ] || nodesToRemove[ x.get('endNodeId') ] ){
            if ( !connsToRemove[ x.get('_id')  ] ){
              connsToRemove[ x.get('_id') ] = x.toJSON();
            } 
          }
        });

      // construct composite command
      var multipleCmd = { kind: "multiple", commands: [] };

      // first remove all connections
      for (var connId in connsToRemove){
        var connToRemove = connsToRemove[connId];
        connToRemove.kind = "removeConnection";
        multipleCmd.commands.push( connToRemove );
      }

      // then remove all nodes
      for (var nodeId in nodesToRemove){
        var nodeToRemove = nodesToRemove[nodeId];
        nodeToRemove.kind = "removeNode";
        multipleCmd.commands.push( nodeToRemove );
      }

      this.runInternalCommand( multipleCmd );
      this.addToUndoAndClearRedo( multipleCmd );

    },

    addNode: function(data){

      this.internalCommands.addNode.call(this, data);
      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "addNode";
      this.addToUndoAndClearRedo( datac );

    },

    removeNode: function(data){

      this.internalCommands.removeNode.call(this, data);
      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "removeNode";
      this.addToUndoAndClearRedo( datac );

    },

    addConnection: function(data){

      this.internalCommands.addConnection.call(this, data);
      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "addConnection";
      this.addToUndoAndClearRedo( datac );

    },

    removeConnection: function(data){

      this.internalCommands.removeConnection.call(this, data);
      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "removeConnection";
      this.addToUndoAndClearRedo( datac );

    }, 

    setNodeProperty: function(data){

      this.internalCommands.setNodeProperty.call(this, data);
      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "setNodeProperty";
      this.addToUndoAndClearRedo( datac );

    },

    internalCommands: {

      multiple: function(data){

        // we prevent runs until all of the changes have been committed
        var previousRunAllowedState = this.runAllowed;
        this.runAllowed = false;

        // run all of the commands
        var that = this;
        data.commands.forEach(function(x){
          that.runInternalCommand.call(that, x);
        });

        // restore previous runAllowed state and, if necessary, do run
        this.runAllowed = previousRunAllowedState;
        if (this.runRejected) this.run();

      },

      addNode: function(data){

        var node = new Node( data, { workspace: this });
        this.get('nodes').add( node );

      },

      removeNode: function(data){

        var node = this.get('nodes').get(data._id);
        this.get('nodes').remove( node );

      }, 

      addConnection: function(data){

        var conn = new Connection(data, { workspace: this });
        this.get('connections').add( conn );
        this.get('nodes').get(conn.get('startNodeId')).connectPort( conn.get('startPortIndex'), true, conn);
        this.get('nodes').get(conn.get('endNodeId')).connectPort(conn.get('endPortIndex'), false, conn);

      }, 

      removeConnection: function(data){

        console.log('removing the connection')
        var conn = this.get('connections').get(data._id);
        this.get('connections').remove( conn );

      }, 

      setNodeProperty: function(data){

        var node = this.get('nodes').get( data._id );
        var prop = data.property;
        if (!data.oldValue) data.oldValue = JSON.parse( JSON.stringify( node.get(prop) ) ); 

        node.set( prop, data.newValue );

      }

    },

    runInternalCommand: function(commandData){

      var cmd = this.internalCommands[ commandData.kind ];
      if (cmd){
        return cmd.call(this, commandData);
      } else {
        console.warn('Could not find the command: ' + cmd.kind);
      }

    },

    redo: function(){

      var rs = this.get('redoStack');

      if (rs.length === 0) {
        return console.warn("Nothing to redo!");
      }

      var data = rs.pop();
      this.runInternalCommand(data);
      this.get('undoStack').push(data);
      
    },

    undo: function(){

      var us = this.get('undoStack');
      if (us.length === 0) {
        return;
      }

      var command = us.pop();
      var undoCommand = this.invertCommand( command );
      this.get('redoStack').push( command );

      this.runInternalCommand(undoCommand);

    },

    invertCommand: function(cmd){

      var inverter = this.commandInversions[cmd.kind];
      if ( inverter ){
        return inverter.call(this, cmd);
      }

      return {};

    },

    commandInversions: {

      addNode: function( cmd ){

        var cmdcop = JSON.parse( JSON.stringify( cmd ) );
        cmdcop.kind = "removeNode";
        return cmdcop;

      },

      multiple: function( cmd ){

        var cmdcop = JSON.parse( JSON.stringify( cmd ) );

        var that = this;
        cmdcop.commands = cmdcop.commands.map(function(x){
          return that.invertCommand.call(that, x);
        });
        cmdcop.commands.reverse();
        
        return cmdcop;

      },

      removeNode: function( cmd ){

        var cmdcop = JSON.parse( JSON.stringify( cmd ) );
        cmdcop.kind = "addNode";
        return cmdcop;

      },

      addConnection: function(cmd){

        var cmdcop = JSON.parse( JSON.stringify( cmd ) );
        cmdcop.kind = "removeConnection";
        return cmdcop;

      },

      removeConnection: function(cmd){

        var cmdcop = JSON.parse( JSON.stringify( cmd ) );
        cmdcop.kind = "addConnection";
        return cmdcop;

      },

      setNodeProperty: function(cmd){

        var cmdcop = JSON.parse( JSON.stringify( cmd) ); 

        var temp = cmdcop.oldValue;
        cmdcop.oldValue = cmdcop.newValue;
        cmdcop.newValue = temp;
        return cmdcop; 

      }

    },

    toJSON : function() {

        if (this._isSerializing) {
            return this.id || this.cid;
        }

        this._isSerializing = true;

        var json = _.clone(this.attributes);

        _.each(json, function(value, name) {
            _.isFunction(value.toJSON) && (json[name] = value.toJSON());
        });

        this._isSerializing = false;


        return json;
    },

    parse : function(resp) {
      resp.nodes = new Nodes( resp.nodes );
      resp.connections = new Connections( resp.connections )
      return resp;
    },

    printModel: function(){
      console.log(this.toJSON());
    },

    run: function() {

      if (!this.runAllowed){
        this.runRejected = true;
        return;
      }

      this.runReject = false;

      if (this.get('nodes').length === 0){
        return;
      }
        
      var bottomNodes = this.get('nodes')
                            .filter(function(ele){
                              return ele.isOutputNode();
                            }).map(function(ele){
                              return ele.get('_id');
                            });

      this.runner.run( bottomNodes );

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

      this.trigger('startProxyDrag');
      return this;
    },

    completeProxyConnection: function(endNode, endPort) {

      this.draggingProxy = false;
      this.trigger('endProxyDrag');

      // this is where we started drawing the connection
      var startNodeId = this.proxyConnection.get('startNodeId')
        , startPort = this.proxyConnection.get('startPortIndex');

      this.makeConnection(startNodeId, startPort, endNode, endPort);
      
      return this;
    },

    endProxyConnection: function() {
      this.proxyConnection.set('hidden', true);
      this.draggingProxy = false;
      return this;
    },

    makeConnection : function(startNodeId, startPort, endNodeId, endPort) {
      
      if (!this.validateConnection(startNodeId, startPort, endNodeId, endPort)){
        return;
      }

      var newCon = {
          startNodeId: startNodeId,
          startPortIndex: startPort,
          endNodeId: endNodeId,
          endPortIndex: endPort,
          _id: this.app.makeId()
        };  

      this.addConnection( newCon );

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



