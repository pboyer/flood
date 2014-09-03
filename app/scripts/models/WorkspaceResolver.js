define(['backbone', 'FLOOD'], 
    function(Backbone, FLOOD) {

  return Backbone.Model.extend({

    initialize: function(atts, arr) {

      this.workspace = arr.workspace;
      this.app = arr.app;

    },

    resolveAll: function(){
      this.initializeDependencies( this.workspace.get('workspaceDependencyIds') );
    },

    initializeDependencies: function(depIds){

      if (depIds.length === 0 || !depIds ) {
        this.workspace.trigger('requestRun');
        return;
      }

      this.awaitedWorkspaceDependencyIds = [];

      var that = this;
      this.app.get('workspaces').on('add', function(ws){ that.resolveDependency.call(that, ws); }, this);

      depIds.forEach(function(x){
        that.awaitOrResolveDependency.call(that, x);
      });
    },

    cleanupDependencies: function(){
      this.workspace.set( 'workspaceDependencyIds', this.workspace.regenerateDependencies() );
    },

    awaitOrResolveDependency: function(id){

      var ws = this.app.getLoadedWorkspace(id);
      if (ws) return this.resolveDependency(ws);
 
      this.awaitedWorkspaceDependencyIds.push(id);
      
      this.app.loadWorkspace( id ); 

    },

    resolveDependency: function(workspace){

      if (workspace.id === this.id) return;

      var index = this.awaitedWorkspaceDependencyIds.indexOf( workspace.id );

      if (index < 0) return;

      this.awaitedWorkspaceDependencyIds.remove(index);
      this.workspace.sendDefinitionToRunner( workspace.id );
      this.watchOneDependency( workspace );
      this.syncCustomNodesWithWorkspace( workspace );

      if (this.awaitedWorkspaceDependencyIds.length === 0) {
        this.workspace.run();
        this.cleanupDependencies();
      }

    },

    addWorkspaceDependency: function( id, watch ){

      var ws = this.app.getLoadedWorkspace(id);

      if (!ws) throw new Error("You tried to add an unloaded workspace as a dependency!")

      var depDeps = ws.get('workspaceDependencyIds')
        , currentDeps = this.workspace.get('workspaceDependencyIds')
        , unionDeps = _.union( [id], currentDeps, depDeps );

      this.workspace.set( 'workspaceDependencyIds', unionDeps );

      if (watch) this.watchDependency( id );

    },

    watchDependency: function( id ){

      var ws = this.app.getLoadedWorkspace(id);

      var allDepWorkspaces = ws.get('workspaceDependencyIds').concat( id );

      allDepWorkspaces.forEach(function(depWs){
        this.watchOneDependency( depWs );
      }.bind( this ) );

    },

    watchedDependencies: {},

    watchOneDependency: function( customNodeWorkspace ){

      if ( !customNodeWorkspace.id ) 
        customNodeWorkspace = this.app.getLoadedWorkspace( customNodeWorkspace );

      if ( this.watchedDependencies[ customNodeWorkspace.id ] ) return;
      this.watchedDependencies[ customNodeWorkspace.id ] = true;

      var that = this;

      var sync = function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace) }
        , syncAndRequestRun = function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace); that.workspace.trigger('requestRun'); }
        , syncAndUpdateRunner = function(){ that.syncCustomNodesWithWorkspace.call(that, customNodeWorkspace); that.workspace.trigger('updateRunner'); };

      customNodeWorkspace.on('change:name', sync, this);
      customNodeWorkspace.on('change:workspaceDependencyIds', sync, this);
      customNodeWorkspace.on('requestRun', syncAndRequestRun, this );
      customNodeWorkspace.on('updateRunner', syncAndUpdateRunner, this );

    },

    getIndirectlyAffectedCustomNodes: function(functionId){

      var cns = this.workspace.getCustomNodes();

      var thisApp = this.app;
      return cns.filter(function(cn){

        var id = cn.get('type').functionId
          , ws = thisApp.getLoadedWorkspace( id );

        if (!ws) return false;

        var wsd = ws.get('workspaceDependencyIds');
        return id != functionId && wsd.indexOf( functionId ) != -1;

      });

    },

    syncCustomNodesWithWorkspace: function(workspace){

      if (typeof workspace === "string") workspace = this.app.getLoadedWorkspace(workspace);

      this.syncDirectlyAffectedCustomNodesWithWorkspace( workspace );
      this.syncIndirectlyAffectedCustomNodesWithWorkspace( workspace );

    },

    syncDirectlyAffectedCustomNodesWithWorkspace: function(workspace){

      // get the nodes directly affected by this change
      var directlyAffectedCustomNodes = this.workspace.getCustomNodesWithId(workspace.id);

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

      if (directlyAffectedCustomNodes.length > 0) this.workspace.sync('update', this.workspace);

    },

    syncIndirectlyAffectedCustomNodesWithWorkspace: function(workspace){

      var indirectlyAffectedNodes = this.getIndirectlyAffectedCustomNodes( workspace.id );

      indirectlyAffectedNodes.forEach(function(x){
        x.trigger('updateRunner');
      });

      if (indirectlyAffectedNodes.length > 0) this.workspace.sync('update', this.workspace );

    }

  });

});



