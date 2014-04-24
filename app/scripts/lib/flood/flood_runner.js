importScripts( 'scheme.js', 'flood.js', 'csg.js' ); 

// Routing

var that = this;

onmessage = function (m) {

	that[ "on_" + m.data.kind ](m.data);

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

workspaces = {};

// Receive

on_currentState = function(){

	var s = { kind: "currentState", workspaceCount: workspaceCount() };	
	success(s);

};

on_clearAllWorkspaces = function(){

	workspaces = {};
	success({kind: "clearAllWorkspaces"});

};

on_run = function(data){

	var workspace = lookupWorkspace(data.workspace_id);
	if (!workspace) return fail({ kind: "run", msg: "The workspace id given is not valid" }, data.silent);

	// get all nodes with output ports
	var S = new scheme.Interpreter()
	  , baseNode = null
	  , bottomNodes = workspace.nodes
	                      .filter(function(ele){
	                        return !(data.bottom_ids.indexOf(ele.id) < 0 );
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

	return success({ kind: "run", workspace_id: workspace.id }, data.silent);

};

on_addWorkspace = function(data){

	var workspace = lookupWorkspace(data.workspace_id);
	if (workspace) return fail({kind: "addWorkspace", msg: "A workspace with that id already exists"});

	var workspace = { id: data.workspace_id, nodes: [] };

	workspaces[data.workspace_id] = workspace;

	if (data.nodes){
		data.nodes.forEach(function(x){
			x.workspace_id = workspace.id;
			x.silent = true;
			on_addNode(x);
		});
	}

	if (data.connections){
		data.connections.forEach(function(x){
			x.workspace_id = workspace.id;
			x.silent = true;
			on_addConnection(x);
		});
	}

	return success({kind: "addWorkspace", workspace_id: data.workspace_id }, data.silent);

};

on_removeWorkspace = function(data){

	var workspace = lookupWorkspace(data.id);
	if (!workspace) return fail({kind: "removeWorkspace", msg: "Workspace with that id does not exist"});

	delete workspaces[data.id];

	return success({ kind: "removeWorkspace" }, data.silent);

}

on_addConnection = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "run", msg: "The workspace id given is not valid" }, data.silent);

	var sn = lookupNode(ws, data.start_id);
	if (!sn) return fail({ kind: "addConnection", msg: "Start node with given id does not exist", workspace_id: data.workspace_id, start_id: data.start_id });

	var en = lookupNode(ws, data.end_id);
	if (!en) return fail({ kind: "addConnection", msg: "End node with given id does not exist", workspace_id: data.workspace_id, end_id: data.end_id });

	var si = data.start_port_index;
	var ei = data.end_port_index;

	if (si < 0 || si >= sn.outputs.length ) 
		return fail({ kind: "addConnection", msg: "Start port index too high" });

	if (ei < 0 || ei >= en.inputs.length ) 
		return fail({ kind: "addConnection", msg: "End port index too high" });

	en.inputs[ei].connect( sn, si );

	return success({ kind: "addConnection" });

};

on_removeConnection = function(data){

	var ws = lookupWorkspace( data.workspace_id );
	if (!ws) return fail({ kind: "removeConnection", msg: "The workspace does not exist" }, data.silent);

	var end = lookupNode( ws, data.id );
	if (!end) return fail({ kind: "removeConnection", msg: "The node does not exist" }, data.silent);

	if (data.port_index < 0 || data.port_index >= end.inputs.length) 
		return fail({ kind: "removeConnection", msg: "The port index does not exist" }, data.silent);

	end.inputs[data.port_index].disconnect();

  return success({ kind: "removeConnection" }, data.silent);

};

on_addNode = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "addNode", msg: "The workspace does not exist" }, data.silent);

	var id = lookupNodeIndex(ws, data.id);
	if (!(id < 0)) return fail({ kind: "addNode", msg: "Node with given id already exists", workspace_id: data.workspace_id, id: data.id });

	var node = new FLOOD.nodeTypes[ data.typeName ]();

	node.id = data.id;
	node.replication = data.replication;
	node.lastValue = data.lastValue;
	node.evalComplete = post_nodeEvalComplete;
	if ( data.isClean ) node.setClean();
	node.extend(data.extensions);

	ws.nodes.push(node);

	return success({ kind: "addNode", workspace_id: data.workspace_id, id: data.id }, data.silent);

};

on_removeNode = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "removeNode", msg: "The workspace does not exist" }, data.silent);

	var i = lookupNodeIndex(ws, data.id);
	if (i < 0) return fail({ kind: "removeNode", msg: "A node with the given id does not exist." }, data.silent);

	ws.nodes.splice(i, 1);

	return success({ kind: "removeNode", id : data.id, workspace_id: data.workspace_id }, data.silent);

};

// set the nodes for a workspace
// the entire set of nodes must be sent, although they can provide values
on_setWorkspaceContents = function(data){

	var workspace = lookupWorkspace(data.workspace_id);
	if (!workspace) return fail({ kind: "setWorkspaceContents", msg: "A workspace with the given id does not exist" }, data.silent);

	if (data.nodes){
		data.nodes.forEach(function(x){
			x.workspace_id = workspace.id;
			x.silent = true;
			on_addNode(x);
		});
	} else {
		data.nodes = [];
	}

	if (data.connections){
		data.connections.forEach(function(x){
			x.workspace_id = workspace.id;
			x.silent = true;
			on_addConnection(x);
		});
	} else {
		data.connections = [];
	}

	return success({kind: "setWorkspaceContents", workspace_id: data.workspace_id }, data.silent);

};

on_setReplication = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "setReplication", msg: "The workspace does not exist" }, data.silent);

	var node = lookupNode(ws, data.id);
	if (!node) return fail({ kind: "setReplication", msg: "A node with the given id does not exist." }, data.silent);

	node.replication = data.replication;
	return success({ kind: "setReplication", id: data.id, workspace_id: data.workspace_id, replication: data.replication }, data.silent);

};

// Post

post_nodeDirtied = function(id, value){

	return success({ kind: "nodeDirty", id: id });

};

post_nodeEvalStart = function(id, value){

	return success({ kind: "nodeEvalStart", id: id });

};

post_nodeEvalComplete = function(node, args, isNew, value){

	// that.evalComplete(that, arguments, dirty, that.value);

	return success({ kind: "nodeEvalComplete", value : value, args: args });

};


// Helpers

function objectLength( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
};

workspaceCount = function(){

	return objectLength(workspaces);

}
 
lookupWorkspace = function(id){

	return workspaces[ id ];

};

lookupNode = function(ws, id){

	var i = lookupNodeIndex(ws, id);
	if (i < 0) return;
	return ws.nodes[i];

};

lookupNodeIndex = function(ws, id){

	for (var i = 0; i < ws.nodes.length; i++){
		if (ws.nodes[i].id === id) return i;
	}

	return -1;

};