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

			this.reset();

			vals.workspace.get('connections').on('add', this.addConnection, this );
			vals.workspace.get('connections').on('remove', this.removeConnection, this );

			vals.workspace.get('nodes').on('add', this.addNode, this );
			vals.workspace.get('nodes').on('remove', this.removeNode, this );

			this.runCount = 0;
			this.averageRunTime = 0;

	  },

	  post: function(data, quiet){

	  	if (!data.workspace_id)
	  		data.workspace_id = this.workspace.get('_id');

	  	this.worker.postMessage(data);

	  	if (quiet) return;

	  	this.trigger('post', data );

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

	  	var node = this.workspace.get('nodes').get( data._id );
	  	if (node)
	  		node.onEvalComplete( data.isNew, data.value, data.prettyValue );

	  },

	 	on_nodeEvalFailed: function(data){

	 		var node = this.workspace.get('nodes').get( data._id );
	  	if (node)
	  		this.workspace.get('nodes').get( data._id ).onEvalFailed(data.exception);

	  },

	 	on_nodeEvalBegin: function(data){

	 		var node = this.workspace.get('nodes').get( data._id );
	  	if (node)
	  		this.workspace.get('nodes').get( data._id ).onEvalBegin( data.isNew );

	  },

	  on_run: function(data){

	  	console.log( data );
	  	this.set('isRunning', false);
	  	this.runCount++;

	  },

	  cancel: function(){

	  	this.set('isRunning', false);
	  	this.worker.terminate();
	  	this.reset();

	  },

	  runQueued : false,

	  run: _.throttle(function( bottomIds ){

	  	this.post({ kind: "run", bottom_ids: bottomIds });
	  	this.set('isRunning', true);

	  }, 120),

	  watchNodeEvents: function( node ){

	  	var u = function(){ this.updateNode( node ); };
	  	node.on('change:replication', u, this );
      node.on('change:ignoreDefaults', u, this);
  		node.on('updateRunner', u, this );

	  },

	  updateNode: function( node ){

	  	var n = node.serialize();
	  	n.kind = "updateNode";
	  	n.workspace_id = node.workspace.id;

	  	this.post( n );

	  },

	  addNode: function(node){

	  	var n = node.serialize();
	  	n.kind = "addNode";
	  	n.workspace_id = node.workspace.id;

	  	this.watchNodeEvents( node );

	  	this.post(n);

	  },

	  removeNode: function(node){

	  	var n = node.serialize();
	  	n.kind = "removeNode";
	  	n.workspace_id = node.workspace.id;

	  	this.post( n );

	  },

	  addConnection: function(connection, workspace){

	  	console.log(connection)

	  	var c = connection.toJSON();
	  	c.kind = "addConnection";
	  	c.id = connection.get('_id');
	  	c.workspace_id = connection.workspace.id;

	  	this.post(c);

	  },

	  removeConnection: function(connection){

	  	var c = connection.toJSON();
	  	c.kind = "removeConnection";
	  	c.id = connection.get('endNodeId');
	  	c.portIndex = connection.get('endPortIndex');
	  	c.workspace_id = connection.workspace.id;

	  	this.post( c );

	  },	

	  recompile: function(workspace){

	  	console.log('recompiling ', workspace.get('name'));

	  	var c = workspace.toJSON();
	  	c.kind = "recompile";

	  	this.post( c );

	  },

	 	addDefinition: function(workspace){

	  	var c = workspace.toJSON();
	  	c.kind = "addDefinition";
	  	c.workspace_id = c._id;

			workspace.get('connections').on('add', function(x){ 
				this.addConnection(x);
				this.recompile(workspace);
				this.workspace.run(); 
			}, this );

			workspace.get('connections').on('remove', function(x){ 
				this.removeConnection(x);
				this.recompile(workspace);
				this.workspace.run(); 
			}, this );

			workspace.get('nodes').on('add', function(x){ 
				this.addNode(x);
				this.recompile(workspace);
				this.workspace.run(); 
			}, this );

			workspace.get('nodes').on('remove', function(x){ 
				this.removeNode(x);
				this.recompile(workspace);
				this.workspace.run(); 
			}, this );

	  	this.post( c );

	  },	

	  on_addConnection: function(data){

	  	console.log(data);

	  },

	  on_removeConnection: function(data){

	  	console.log(data);

	  },

	  on_recompile: function(data){

	  	console.log(data);

	  },

	  on_addNode: function(data){

	  	console.log(data);

	  },

	  reset: function(){

	  	this.initWorker();
	  	this.initWorkspace();

	  }

	});
});