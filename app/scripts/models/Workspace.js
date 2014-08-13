define(['backbone', 'Nodes', 'Connection', 'Connections', 'scheme', 'FLOOD', 'Runner', 'Node', 'Marquee'], 
    function(Backbone, Nodes, Connection, Connections, scheme, FLOOD, Runner, Node, Marquee) {

  return Backbone.Model.extend({

    idAttribute: "_id",

    url: function(){
      return '/ws/' + this.get('_id');
    },

    defaults: {
      name: "Unnamed Workspace",
      nodes: null,
      connections: null,
      zoom: 1,
      current: false,
      isPublic: false,
      isRunning: false,
      lastSaved: Date.now(),
      offset: [0,0],

      // undo/redo stack
      undoStack: [],
      redoStack: [],
      clipBoard: [],

      // for custom nodes
      workspaceDependencyIds: [],
      isCustomNode: false

    },

    // connection creation
    draggingProxy: false,
    proxyConnection: null,

    // marquee selection
    dragSelect: false,

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

      this.get('connections').on('add remove', function(){ 
        that.trigger('change:connections'); 
        that.trigger('requestRun');
      });

      this.get('nodes').on('add remove', function(){ 
        that.trigger('change:nodes'); 
        that.trigger('requestRun');
      });

      this.proxyConnection = new Connection({
        _id: -1, 
        startProxy: true, 
        endProxy: true, 
        startProxyPosition: [0,0], 
        endProxyPosition: [0,0],
        hidden: true }, { workspace: this });

      this.marquee = new Marquee({
        _id: -1, 
        hidden: true }, { workspace: this });

      this.runAllowed = true;

      if ( !this.get('isCustomNode') ) this.initializeRunner();

      this.sync = _.throttle(this.sync, 2000);

      // save on every change
      var throttledSync = _.throttle(function(){ this.sync('update', this); }, 1000);
      this.on('runCommand', throttledSync, this);
      this.on('change:name', throttledSync, this);
      this.on('change:zoom', throttledSync, this);
      this.on('change:workspaceDependencyIds', throttledSync, this);
      this.on('requestRun', this.run, this);

      if ( this.get('isCustomNode') ) this.initializeCustomNode();

      // this.cleanupDependencies();
      this.initializeDependencies( this.get('workspaceDependencyIds') );

      this.app.trigger('workspaceLoaded', this);

    },

    initializeDependencies: function(depIds){

      if (depIds.length === 0 || !depIds ) {
        console.log(this.get('name') + " has no dependencies");
        this.trigger('requestRun');
        return;
      }

      this.awaitedWorkspaceDependencyIds = [];

      console.log(this.get('name') + " has dependencies: " + JSON.stringify( depIds) );

      var that = this;

      this.app.get('workspaces').on('add', function(ws){ that.resolveDependency.call(that, ws); }, this);

      depIds.forEach(function(x){
        that.awaitOrResolveDependency.call(that, x);
      });

    },

    cleanupDependencies: function(){

      var oldDeps = this.get('workspaceDependencyIds');;

      console.log("Before cleaning up, " + this.get('name') + " has dependencies: " + JSON.stringify( oldDeps ) );

      var that = this;
      var deps = oldDeps.reduce(function(a,x){

        var cns = that.getCustomNodesWithId(x);

        if ( cns && cns.length != 0 ) a.push(x);
        return a;

      }, []);

      this.set('workspaceDependencyIds', deps);

    },

    awaitOrResolveDependency: function(id){

      var ws = this.app.getLoadedWorkspace(id);
      if (ws) return this.resolveDependency(ws);
 
      this.awaitedWorkspaceDependencyIds.push(id);
      
      this.app.setWorkspaceToBackground( id );
      this.app.loadWorkspace( id ); 

    },

    resolveDependency: function(workspace){

      // console.log(this.get('name') + " resolve dep with " + workspace.id );
      // console.log(this.get('name') + " still awaits " + this.awaitedWorkspaceDependencyIds );

      if (workspace.id === this.id) return;

      var index = this.awaitedWorkspaceDependencyIds.indexOf( workspace.id );

      if (index < 0) return;

      // console.log('Resolving dependency for ' + this.get("name") + " with " + workspace.id );
      // console.log("Awaited workspace ids are " + this.awaitedWorkspaceDependencyIds );

      this.awaitedWorkspaceDependencyIds.remove(index);
      this.sendDefinitionToRunner( workspace.id );
      this.watchDependency( workspace );
      this.syncCustomNodesWithWorkspace( workspace );

      if (this.awaitedWorkspaceDependencyIds.length === 0) this.run();

    },

    watchDependency: function( customNodeWorkspace ){

      var that = this;

      customNodeWorkspace.on('change:name', function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace) }, this);
      customNodeWorkspace.on('change:workspaceDependencyIds', function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace) }, this);
      customNodeWorkspace.on('requestRun', function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace); that.trigger('requestRun'); }, this );
      customNodeWorkspace.on('updateRunner', function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace); that.trigger('updateRunner'); }, this );

    },

    addWorkspaceDependency: function(id, watchDependency){

      console.log('Adding ' + id + " as a dependency for " + this.get('name'));

      var ws = this.app.getLoadedWorkspace(id);

      if (!ws) throw new Error("You tried to add an unloaded workspace as a dependency!")

      if (watchDependency) this.watchDependency( ws );

      var depDeps = ws.get('workspaceDependencyIds')
        , currentDeps = this.get('workspaceDependencyIds')
        , unionDeps = _.union( [id], currentDeps, depDeps );

      console.log('After adding dependencies, the dependencies for ' + this.get('name') + " is now " + unionDeps );

      this.set( 'workspaceDependencyIds', unionDeps );

    },

    getCustomNodeInputsOutputs: function(getOutputs){

      var typeName = getOutputs ? "Output" : "Input";

      return this.get('nodes').filter(function(x){
        return x.get('type').typeName === typeName;
      });

    },

    getCustomNodes: function(){

      return this.get('nodes').filter(function(x){
        return x.get('type') instanceof FLOOD.internalNodeTypes.CustomNode;
      });

    },

    getCustomNodesWithId: function(functionId){

      return this.getCustomNodes().filter(function(x){
        return x.get('type').functionId === functionId;
      });

    },

    // for each custom node in the graph - does it depend on the changed functionId?
    // if so, return it
    getIndirectlyAffectedCustomNodes: function(functionId){

      var cns = this.getCustomNodes();

      var thisApp = this.app;
      return cns.filter(function(cn){

        var id = cn.get('type').functionId
          , wsd = thisApp.getLoadedWorkspace( id ).get('workspaceDependencyIds');
        return id != functionId && wsd.indexOf( functionId ) != -1;

      })

    },

    syncCustomNodesWithWorkspace: function(workspace){

      if (typeof workspace === "string") workspace = this.app.getLoadedWorkspace(workspace);

      this.syncDirectlyAffectedCustomNodesWithWorkspace( workspace );
      this.syncIndirectlyAffectedCustomNodesWithWorkspace( workspace );

    },

    syncDirectlyAffectedCustomNodesWithWorkspace: function(workspace){

      // get the nodes directly affected by this change
      var directlyAffectedCustomNodes = this.getCustomNodesWithId(workspace.id);

      // get the workspace inputs/outputs
      var inputNodes = workspace.getCustomNodeInputsOutputs();
      var outputNodes = workspace.getCustomNodeInputsOutputs(true);

      directlyAffectedCustomNodes.forEach(function(x){

        // cleanup hanging input connections

          var inputConns = x.get('inputConnections');
          var diff = inputNodes.length - inputConns.length;

          if (diff > 0){
            for (var i = 0; i < diff; i++){
              inputConns.push([]);
            }
          } else {
            for (var i = 0; i < -diff; i++){

              var inConn = x.getConnectionAtIndex(inputConns.length - 1);

              if (inConn != null){
                x.workspace.removeConnection(inConn);
              }

              inputConns.pop();
            }

          }

        // clean up hanging output connections

          var outputConns = x.get('outputConnections');
          var diff2 = outputNodes.length - outputConns.length;

          if (diff2 > 0){

            for (var i = 0; i < diff2; i++){
              outputConns.push( [] );
            }

          } else {

            for (var i = 0; i < -diff2; i++){

              x.get('outputConnections')
                .last()
                .slice(0)
                .forEach(function(outConn){ x.workspace.removeConnection(outConn); })

              outputConns.pop();
            }

          }

        // set the type

          x.get('type').functionName = workspace.get('name');
          x.get('type').setNumInputs(inputNodes.length);
          x.get('type').setNumOutputs(outputNodes.length);

        // save to extra 

          var extraCop = JSON.parse( JSON.stringify( x.get('extra') ) );

          extraCop.numInputs = inputNodes.length;
          extraCop.numOutputs = outputNodes.length;
          extraCop.functionName = workspace.get('name');

        // sync the input names  ------------------------

          extraCop.inputNames = inputNodes.map(function(inputNode, ind){
            var ex = inputNode.get('extra');

            if (ex === undefined || !ex.name || ex.name === "" ){
              return String.fromCharCode(97 + ind);
            } 

            return ex.name;
          });

          extraCop.inputNames.forEach(function(name, ind) {
            x.get('type').inputs[ind].name = name;
          });

        // sync the output names  ------------------------

          extraCop.outputNames = outputNodes.map(function(outputNode, ind){
            var ex = outputNode.get('extra');

            if (ex === undefined || !ex.name || ex.name === "" ){
              return String.fromCharCode(97 + ind);
            } 

            return ex.name;
          });

          extraCop.outputNames.forEach(function(name, ind) {
            x.get('type').outputs[ind].name = name;
          });

        // silently set for serialization
        x.set('extra', extraCop);

        // triggers a redraw
        x.trigger('requestRender');

        // update runner
        x.trigger('updateRunner');

      });

      if (directlyAffectedCustomNodes.length > 0) this.sync('update', this);

    },

    syncIndirectlyAffectedCustomNodesWithWorkspace: function(workspace){

      var indirectlyAffectedNodes = this.getIndirectlyAffectedCustomNodes( workspace.id );

      indirectlyAffectedNodes.forEach(function(x){

        x.trigger('updateRunner');

      });

      if (indirectlyAffectedNodes.length > 0) this.sync('update', this);

    },

    initializeRunner: function(){

      this.runner = new Runner({id : this.get('_id') }, { workspace: this });

      var that = this;
      this.runner.on('change:isRunning', function(v){
        that.set('isRunning', v.get('isRunning'));
      });

    },

    customNode : null,

    initializeCustomNode: function(){

      this.customNode = new FLOOD.internalNodeTypes.CustomNode( this.get('name'), this.get('_id') );

      var ni = this.get('nodes').where({typeName: "Input"}).length;
      var no = this.get('nodes').where({typeName: "Output"}).length;

      this.customNode.setNumInputs(ni);
      this.customNode.setNumOutputs(no);

      this.app.SearchElements.addCustomNode( this.customNode );

      var that = this;

      this.on('change:name', function(){
        that.customNode.functionName = that.get('name');
        that.app.SearchElements.addCustomNode( that.customNode );
      }, this);

    },

    toJSON : function() {

        this.set('undoStack', _.last( this.get('undoStack'), 10) );
        this.set('redoStack', _.last( this.get('redoStack'), 10) );

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

    zoomIn: function(){

      if ( this.get('zoom') > 4 ){
        return;
      }

      this.set('zoom', this.get('zoom') + 0.05);

    },

    zoomOut: function(){

      if ( this.get('zoom') < 0.2 ){
        return;
      }

      this.set('zoom', this.get('zoom') - 0.05);

    },

    parse : function(resp) {

      resp.nodes = new Nodes( resp.nodes );
      resp.connections = new Connections( resp.connections )
      return resp;
    },

    printModel: function(){
      console.log(this.toJSON());
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

    makeId: function(){
      return this.app.makeId();
    },

    copy: function(){

      // get all selected nodes
      var that = this;
      var nodeFound = false;
      var copyNodes = {};
      this.get('nodes')
          .each(function(x){ 
            if ( x.get('selected') ){
              nodeFound = true;
              copyNodes[ x.get('_id') ] = x.serialize();
            }
          });

      // TODO: clear the clipboard!
      if (!nodeFound) return;

      // get all relevant connections
      var copyConns = {};
      var connCount = 0;
      this.get('connections')
        .each(function(x){

          if (x.get('_id') === -1 || x.get('startProxy') || x.get('endProxy')) return;

          if ( ( copyNodes[ x.get('startNodeId') ] && copyNodes[ x.get('endNodeId') ] ) || copyNodes[ x.get('endNodeId') ]  ){

            if ( !copyConns[ x.get('_id')  ] ){
              connCount++;
              copyConns[ x.get('_id') ] = x.toJSON();
            } 
          }
        });

        console.log(connCount, " connections copied")

      this.app.set('clipboard', { nodes: copyNodes, connections: copyConns });

    },

    paste: function(){

      // build the command
      var cb = JSON.parse( JSON.stringify( this.app.get('clipboard') ) );

      var that = this;

      var nodes = {};
      var nodeOffset = Math.min( 20, Math.abs( 80 * Math.random() ) );

      var nodeCount = 0;

      _.each(cb.nodes, function(x){

        // give new id for building the paste
        nodes[x._id] = x;
        nodes[x._id].position = [ x.position[0] + nodeOffset, x.position[1] + nodeOffset ];
        nodes[x._id]._id = that.makeId();
        nodeCount++;

      });

      if (nodeCount > 0) this.get('nodes').deselectAll();

      var connections = {};

      _.each(cb.connections, function(x){

        if ( nodes[ x.endNodeId ] ){
          x.endNodeId = nodes[ x.endNodeId ]._id;
        }

        if ( nodes[x.startNodeId]){
          x.startNodeId = nodes[ x.startNodeId ]._id;
        }

        connections[x._id] = x;
        connections[x._id]._id = that.makeId();

      });

      // build the command
      var multipleCmd = { kind: "multiple", commands: [] };

      // build all of the nodes
      for (var id in nodes){
        var cpnode = cb.nodes[id];
        cpnode.kind = "addNode";
        multipleCmd.commands.push( cpnode );
      }

      // then builds the connections
      for (var id in connections){
        var cpConn = connections[id];
        cpConn.kind = "addConnection";
        multipleCmd.commands.push( cpConn );
      }

      this.runInternalCommand( multipleCmd );
      this.addToUndoAndClearRedo( multipleCmd );

    },

    addNodeByNameAndPosition: function(name, position){

      if (name === undefined || position === undefined ) return;

      var se = this.app.SearchElements.where({ name: name })[0];

      if (!se) {
        console.warn('Could not find node with name in Library: ' + name)
        return;
      }

      if (se.get('isCustomNode')){

        var sec = { typeName: "CustomNode"
                    , position: position
                    , _id: this.makeId()  };

        sec.extra = { functionId: se.get('functionId')
                      , functionName: se.get('functionName')
                      , numInputs: se.get('numInputs')
                      , numOutputs: se.get('numOutputs')
                    };

        return this.addNode( sec );

      }

      this.addNode({ typeName: name, position: position, _id: this.makeId() });

    },

    addNode: function(data){

      if ( data.typeName === "CustomNode" ){
        var id = data.extra.functionId;
        this.addWorkspaceDependency( id, true );
        this.sendDefinitionToRunner( id );
      }

      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "addNode";
      this.runInternalCommand(datac);
      this.addToUndoAndClearRedo( datac );

      if ( data.typeName === "CustomNode" ){
        this.syncCustomNodesWithWorkspace( id );
      }

      this.trigger('requestRun');

    },

    sendDefinitionToRunner: function( id ){

      if (!this.runner) {
        return;
      }

      this.runner.addDefinition( this.app.getLoadedWorkspace( id ) );

    },


    removeNode: function(data){

      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "removeNode";
      this.runInternalCommand(datac);
      this.addToUndoAndClearRedo( datac );

    },

    addConnection: function(data){

      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "addConnection";
      this.runInternalCommand(datac);
      this.addToUndoAndClearRedo( datac );

    },

    addConnectionAndRemoveExisting : function(startNodeId, startPort, endNodeId, endPort) {
      
      var multiCmd = { kind: "multiple", commands: [] };

      // remove any existing connection
      var endNode = this.get('nodes').get(endNodeId)
      if ( !endNode ) return this;
      var existingConnection = endNode.getConnectionAtIndex( endPort );

      if (existingConnection != null){
        var rmConn = existingConnection.toJSON();
        rmConn.kind = "removeConnection";
        multiCmd.commands.push( rmConn );
      }

      var newConn = {
          kind: "addConnection",
          startNodeId: startNodeId,
          startPortIndex: startPort,
          endNodeId: endNodeId,
          endPortIndex: endPort,
          _id: this.app.makeId()
        };  

      multiCmd.commands.push( newConn );

      this.runInternalCommand( multiCmd );
      this.addToUndoAndClearRedo( multiCmd );

      return this;
    },

    removeConnection: function(data){

      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "removeConnection";
      this.runInternalCommand(datac);
      this.addToUndoAndClearRedo( datac );

    }, 

    setNodeProperty: function(data){

      var datac = JSON.parse( JSON.stringify( data ) );
      datac.kind = "setNodeProperty";
      this.runInternalCommand(datac);
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

        var nodes = this.get('nodes');
        if ( !nodes.get( data.startNodeId ) || !nodes.get( data.endNodeId ) ) return;

        var conn = new Connection(data, { workspace: this });
        this.get('connections').add( conn );
        this.get('nodes').get(conn.get('startNodeId')).connectPort( conn.get('startPortIndex'), true, conn);
        this.get('nodes').get(conn.get('endNodeId')).connectPort(conn.get('endPortIndex'), false, conn);

      }, 

      removeConnection: function(data){

        var conn = this.get('connections').get(data._id);
        if (conn) this.get('connections').remove( conn );

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
        cmd.call(this, commandData);
        this.trigger('runCommand');
        return;
      } 

      console.warn('Could not find the command: ' + cmd.kind);

    },

    redo: function(){

      var rs = this.get('redoStack');

      if (rs.length === 0) {
        return console.warn("Nothing to redo!");
      }

      var data = rs.pop();
      this.get('undoStack').push(data);
      this.runInternalCommand(data);
      
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

    run: function() {

      if ( !this.runAllowed || this.get('isCustomNode') ){
        this.runRejected = true;
        return;
      }

      this.runReject = false;

      if (this.get('nodes').length === 0){
        return;
      }
        
      var bottomNodes = this.get('nodes')
                            .filter(function(ele){
                              return ele.isOutputNode() && ele.get('type').outputs.length > 0;
                            }).map(function(ele){
                              return ele.get('_id');
                            });

      this.runner.run( bottomNodes );

    },

    startMarqueeSelect: function(startPosition) {

      this.set('marqueeStart', startPosition );
      this.set('marqueeEnd', startPosition );
      this.set('marqueeSelectEnabled', true);

      return this;
    },

    endMarqueeSelect: function() {

      this.set('marqueeSelectEnabled', false);
  
      return this;
    },

    startProxyConnection: function(startNodeId, nodePort, startPosition) {

      // Note: this is a quick fix for when the proxy connection
      this.set('proxyStartId', startNodeId);
      this.set('proxyStartPortIndex', nodePort);

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

    completeProxyConnection: function(endNodeId, endPortIndex) {

      this.draggingProxy = false;
      this.trigger('endProxyDrag');

      var startNodeId = this.proxyConnection.get('startNodeId')
        , startPortIndex = this.proxyConnection.get('startPortIndex');

      this.addConnectionAndRemoveExisting(startNodeId, startPortIndex, endNodeId, endPortIndex);
      
      return this;
    },

    endProxyConnection: function() {

      this.proxyConnection.set('hidden', true);
      this.draggingProxy = false;
      return this;

    }

  });

});



