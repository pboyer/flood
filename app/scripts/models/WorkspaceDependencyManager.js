define(['backbone', 'FLOOD'], 
    function(Backbone, FLOOD) {

  return Backbone.Model.extend({

    initialize: function(atts, arr) {

      this.workspace = arr.workspace;
      this.app = arr.app;

    },

    resolveAll: function(){

      // // this.cleanupDependencies();
      this.initializeDependencies( this.workspace.get('workspaceDependencyIds') );

    },

    initializeDependencies: function(depIds){

      if (depIds.length === 0 || !depIds ) {
        console.log(this.workspace.get('name') + " has no dependencies");
        this.workspace.trigger('requestRun');
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

      var oldDeps = this.workspace.get('workspaceDependencyIds');;

      // console.log("Before cleaning up, " + this.get('name') + " has dependencies: " + JSON.stringify( oldDeps ) );

      var that = this;
      var deps = oldDeps.reduce(function(a,x){

        var cns = that.getCustomNodesWithId(x);

        if ( cns && cns.length != 0 ) a.push(x);
        return a;

      }, []);

      this.workspace.set('workspaceDependencyIds', deps);

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

      var sync = function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace) }
        , syncAndRequestRun = function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace) }
        , syncAndUpdateRunner = function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace) };

      customNodeWorkspace.on('change:name', sync, this);
      customNodeWorkspace.on('change:workspaceDependencyIds', sync, this);
      customNodeWorkspace.on('requestRun', syncAndRequestRun, this );
      customNodeWorkspace.on('updateRunner', syncAndUpdateRunner, this );

    },

    addWorkspaceDependency: function( id, watchDependency ){

      // console.log('Adding ' + id + " as a dependency for " + this.get('name'));

      var ws = this.app.getLoadedWorkspace(id);

      if (!ws) throw new Error("You tried to add an unloaded workspace as a dependency!")

      if (watchDependency) this.watchDependency( ws );

      var depDeps = ws.get('workspaceDependencyIds')
        , currentDeps = this.workspace.get('workspaceDependencyIds')
        , unionDeps = _.union( [id], currentDeps, depDeps );

      // console.log('After adding dependencies, the dependencies for ' + this.get('name') + " is now " + unionDeps );

      this.workspace.set( 'workspaceDependencyIds', unionDeps );

    },

    getCustomNodeInputsOutputs: function(getOutputs){

      var typeName = getOutputs ? "Output" : "Input";

      return this.workspace.get('nodes').filter(function(x){
        return x.get('type').typeName === typeName;
      });

    },

    getCustomNodes: function(){

      return this.workspace.get('nodes').filter(function(x){
        return x.get('type') instanceof FLOOD.internalNodeTypes.CustomNode;
      });

    },

    getCustomNodesWithId: function(functionId){

      return this.workspace.getCustomNodes().filter(function(x){
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

              var ocs = x.get('outputConnections')
                .last();

              if (ocs){
                ocs.slice(0).forEach(function(outConn){ x.workspace.removeConnection(outConn); })
              }

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

      if (directlyAffectedCustomNodes.length > 0) this.workspace.sync('update', this);

    },

    syncIndirectlyAffectedCustomNodesWithWorkspace: function(workspace){

      var indirectlyAffectedNodes = this.getIndirectlyAffectedCustomNodes( workspace.id );

      indirectlyAffectedNodes.forEach(function(x){
        x.trigger('updateRunner');
      });

      if (indirectlyAffectedNodes.length > 0) this.workspace.sync('update', this);

    }

  });

});



