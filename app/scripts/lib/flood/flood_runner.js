importScripts( 'scheme.js', 'flood.js', 'csg.js' ); 

// w = new Worker("flood_runner.js")

// Routing

onmessage = function (m) {

	this[ "on_" + m.data.kind ](m.data);

};

success = function(m, silent){
	if (silent) return;
	m.success = true;
	postMessage(m);
};

update = function(m, silent){
	if (silent) return;
	m.success = true;
	postMessage(m);
}

fail = function(m, silent){
	if (silent) return;
	m.success = false;
	postMessage(m);
};


// Core data structures

currentWorkspace = -1;
workspaces = [];


// Receive

on_clearAll = function(){

	workspaces.length = 0;
	currentWorkspace = -1;
	success({kind: "workspacesCleared"});

};

on_run = function(data){

	var workspace = data.workspace_id ? lookupWorkspace(data.id) : getCurrentWorkspace();

	if (!workspace) return fail({ kind: "evalFailed", msg: "No active workspace or workspace id given is not valid" }, data.silent);

	// get all nodes with output ports
	var S = new scheme.Interpreter()
	  , baseNode = null
	  , bottomNodes = workspace.nodes
	                      .filter(function(ele){
	                        return ele.isOutputNode();
	                      }).map(function(ele){
	                        return ele.get('type');
	                      }).map(function(type){
	                        return type.outputs[0];
	                      });

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

	if (baseNode){
	  baseNode.markDirty();
	  S.eval( baseNode.compile() );
	}	

	success({ kind: "evalComplete", id: workspace.id }, data.silent);

};


on_addWorkspace = function(data){

	var workspace = { id: data.id };

	workspaces.push( workspace );

	data.nodes.forEach(function(x){
		x.workspace_id = workspace.id;
		x.silent = true;
		on_addNode(x);
	});
	
	data.connections.forEach(function(x){
		x.workspace_id = workspace.id;
		x.silent = true;
		on_addConnection(x);
	});

	success({kind: "workspaceAdded", id: data.id }, data.silent);

};

on_addConnection = function(data){

  // connect the logic nodes
  var type = this.get('type')
    , opp = connection.getOpposite( this )
    , oppType = opp.node.get('type')
    , oppIndex = opp.portIndex;

  type.inputs[portIndex].connect( oppType, oppIndex );

};

on_removeConnection = function(data){

	var start = lookupNode( data.workspace_id, data.node_start_id )
		, end = lookupNode( data.workspace_id, data.node_end_id );

	if (!start || !end) return fail({ kind: "removeConnectionFailed" }, data.silent);

	start.inputs[data.start_index].disconnect();
	end.inputs[data.end_index].disconnect();

  return success({ kind: "removeConnection" }, data.silent);

};

on_addNode = function(data){

  if ( atts.typeName != null && FLOOD.nodeTypes[atts.typeName] != undefined){
    this.set( 'type', new FLOOD.nodeTypes[ atts.typeName ]() );
  } else {
    this.set( 'type', new FLOOD.nodeTypes.Add() );
  }

  // set the current value from the last stored value
  if (atts.lastValue){
    this.get('type').value = atts.lastValue;
  }

  if (atts.replication){
    this.get('type').replication = atts.replication;
  }

};

on_removeNode = function(data){

};

// set the nodes for a workspace
// the entire set of nodes must be sent, although they can provide values
on_setWorkspaceData = function(data){





};

on_setCurrentWorkspace = function(id){

	var i = lookupWorkspaceIndex(id);
	if ( i < 0 ) return postMessage({kind: "workspaceSetFailed"});

	currentWorkspace = i;
	success({kind: "workspaceSet"});

};

on_setReplication = function(data){

	var node = lookupNode(data.workspace_id, data.id);
	node.replication = data.replication;
	success({ kind: "replicationSet", id: data.id, replication: data.replication }, data.silent);

};


// Post

post_nodeDirtied = function(id, value){

	success({ kind: "nodeDirty", id: id });

};

post_nodeEvalStart = function(id, value){

	success({ kind: "nodeEvalStart", id: id });

};

post_nodeEvalComplete = function(id, isNew, value, prettyValue){

	success({ kind: "nodeEvalComplete", id: id, isNew: isNew, value: value, prettyValue: prettyValue });

};


// Helper

lookupWorkspace = function(id){

	return workspaces[ lookupWorkspaceIndex(id) ];

};

getCurrentWorkspace = function(){

	if ( currentWorkpace < 0 || currentWorkspace >= workspaces.length ) return;
	return workspaces[currentWorkspace];

};

lookupWorkspaceIndex = function(id){

	for (var i = 0; i < workspaces.length; i++){
		var ws = workspaces[i].nodes[j];
		if (ws.id === data.id) {
			return i;
		}
	}

};

lookupNode = function(workspace_id, id){

	var ws = lookupWorkspace(workspace_id);

	if (!ws) return;

	for (var j = 0; j < ws.nodes.length; j++){

		var node = ws.nodes[j];
		if (node.id === id) return node;

	}


};
