define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

	  defaults: {
	  	isRunning : false
	  },

		initialize: function(atts, vals) {

		  	this.app = vals.app;
		  	var ws = vals.workspace;
		  	this.workspace = ws;

		  	this.set('id', ws.get('_id') );

		  	this.initWorker();
		  	this.initWorkspace();

			  vals.workspace.get('connections').on('add', this.addConnection, this );
			  vals.workspace.get('connections').on('remove', this.removeConnection, this );

	      vals.workspace.get('nodes').on('add', this.addNode, this );
	      vals.workspace.get('nodes').on('remove', this.removeNode, this );

	      this.runCount = 0;
	      this.averageRunTime = 0;

	  },

	  post: function(data){

	  	data.workspace_id = this.workspace.get('_id');
	  	this.worker.postMessage(data);

	  },

	  onWorkerMessage: function(data){

	  	var cb = this["on_" + data.kind];
	  	if ( cb ) cb.call(this, data);
			
	  },

	  initWorker: function(){

	  	this.worker = new Worker("scripts/lib/flood/flood_runner.js");

	  	var that = this;

			this.worker.addEventListener('message', function(e) {
				return that.onWorkerMessage.call(that, e.data);	
			}, false);

	  },

	  initWorkspace: function(){

	  	this.post({kind: 'addWorkspace'});

	  	var wsc = this.workspace.toJSON();
	  	var ncb = function(){ this.updateNode( node ); };

	  	var that = this;
	  	this.workspace.get('nodes').each(function(x){
	  		that.watchNodeEvents.call(that, x);
	  	});

	  	wsc.kind = "setWorkspaceContents";
  	  this.post( wsc );

	  },

	  on_nodeEvalComplete: function(data){

	  	this.workspace.get('nodes').get( data._id ).onEvalComplete( data.value, data.prettyValue );

	  },

	  on_run: function(data){

	  	this.set('isRunning', false);
	  	this.runCount++;

	  },

	  on_addNode: function(data){

		  console.warn( data );

	  },

	  cancel: function(){

	  	this.worker.terminate();
	  	// TODO: restart with workspace contents

	  },

	  runQueued : false,

	  run: _.throttle(function( bottomIds ){

	  	this.post({ kind: "run", bottom_ids: bottomIds });
	  	this.set('isRunning', true);

	  }, 180),

	  watchNodeEvents: function( node ){

	  	var u = function(){ this.updateNode( node ); };
	  	node.on('change:replication', u, this );
      node.on('change:ignoreDefaults', u, this);
  		node.on('updateRunner', u, this );

	  },

	  updateNode: function(node){

	  	var n = node.serialize();
	  	n.kind = "updateNode";
	  	this.post(n);

	  },

	  addNode: function(node){

	  	var n = node.serialize();
	  	n.kind = "addNode";
	  	this.watchNodeEvents( node );
	  	this.post(n);

	  },

	  addConnection: function(connection){

	  	var c = connection.toJSON();
	  	c.kind = "addConnection";
	  	c.id = connection.get('_id');

	  	this.post(c);

	  },

	  removeNode: function(node){

	  	this.post( { kind: "removeNode", _id: node.get('_id') });

	  },

	  removeConnection: function(connection){

	  	this.post( { kind: "removeConnection", _id: connection.get('endNodeId'), portIndex: connection.get('endPortIndex') });

	  },	

	  reset: function(){


	  }

	});
});