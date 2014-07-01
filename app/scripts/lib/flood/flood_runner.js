importScripts( 'scheme.js', 'flood.js', 'csg.js', 'flood_csg.js'); 

// Routing
var that = this;

onmessage = function (m) {

	if (!checkCommandData(m.data)) return;
	commands.push(m.data);
	that[ "on_" + m.data.kind ](m.data);

};

checkCommandData = function(data){

	if (!data.kind) {
		fail({kind: "noCommand", msg: "No command given"});
		return false;
	}

	var handler = "on_" + data.kind;

	if (!that[handler]) {
		fail({kind: data.kind, msg: "No such command"});
		return false;
	}

	return true;
}

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
functionDefinitions = {};
commands = [];

// Receive

on_currentState = function(){

	var s = { kind: "currentState", workspaceCount: workspaceCount() };	
	success(s);

};

on_removeAll = function(){

	workspaces = {};
	success({kind: "removeAll"});

};

on_run = function(data){

	var workspace = lookupWorkspace(data.workspace_id);
	if (!workspace) return fail({ kind: "run", msg: "The workspace id given is not valid" }, data.silent);

	var ts = Date.now();

	// get all nodes with output ports
	var S = new scheme.Interpreter();

	// update function definitions
	for (var funcId in functionDefinitions){

		// don't always do this on every run
		var lambda = FLOOD.compileNodesToLambda( workspaces[funcId].nodes );

		var csnodes = workspace.nodes.filter(function(x){
			return x.functionId && x.functionId === funcId;
		}).forEach(function(x){
			x.lambda = lambda;
		});

	}

	var baseNode = null
	  , bottomNodes = workspace.nodes
	                      .filter(function(ele){
	                        return !(data.bottom_ids.indexOf(ele.id) < 0 );
	                      }).map(function(type){
	                        return type.outputs[0];
	                      });

	if ( bottomNodes.length > 1) {
	  baseNode = new FLOOD.internalNodeTypes.Begin();
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

	var te = Date.now();

	var msg = { kind: "run", workspace_id: workspace.id, elapsed: te - ts, expression: "" };

	if (baseNode){
		msg.expression = baseNode.printExpression();
	}

	return success(msg, data.silent);

};

on_addWorkspace = function(data){

	var workspace = lookupWorkspace(data.workspace_id);

	if (workspace) return fail({kind: "addWorkspace", msg: "A workspace with that id already exists"});

	var workspace = { id: data.workspace_id, nodes: [] };

	workspaces[data.workspace_id] = workspace;

	if (data.nodes){
		data.nodes.forEach(function(x){
			x.workspace_id = workspace.id;
			x.silent = false;
			on_addNode(x);
		});
	}

	if (data.connections){
		data.connections.forEach(function(x){
			x.workspace_id = workspace.id;
			x.silent = false;
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

on_addDefinition = function(data){

	this.functionDefinitions[data._id] = null;
	data.workspace_id = data._id;
	on_addWorkspace( data );

};

on_addConnection = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "run", msg: "The workspace id given is not valid" }, data.silent);

	var sn = lookupNode(ws, data.startNodeId );
	if (!sn) return fail({ kind: "addConnection", msg: "Start node with given id does not exist", workspace_id: data.workspace_id, startNodeId : data.startNodeId  });

	var en = lookupNode(ws, data.endNodeId);
	if (!en) return fail({ kind: "addConnection", msg: "End node with given id does not exist", workspace_id: data.workspace_id, endNodeId: data.endNodeId });

	var si = data.startPortIndex;
	var ei = data.endPortIndex;

	if (si < 0 || si >= sn.outputs.length ) 
		return fail({ kind: "addConnection", msg: "Start port index too high" });

	if (ei < 0 || ei >= en.inputs.length ) 
		return fail({ kind: "addConnection", msg: "End port index too high" });

	en.inputs[ei].connect( sn, si );

	return success({ kind: "addConnection" }, data.silent);

};

on_removeConnection = function(data){

	var ws = lookupWorkspace( data.workspace_id );
	if (!ws) return fail({ kind: "removeConnection", msg: "The workspace does not exist" }, data.silent);

	var end = lookupNode( ws, data._id );
	if (!end) end = lookupNode( ws, data.endNodeId );

	if (!end) return fail({ kind: "removeConnection", msg: "The node does not exist" }, data.silent);

	if (data.portIndex < 0 || data.portIndex >= end.inputs.length) 
		return fail({ kind: "removeConnection", msg: "The port index does not exist" }, data.silent);

	end.inputs[data.portIndex].disconnect();

  return success({ kind: "removeConnection", _id: data._id }, data.silent);

};

on_updateNode = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "updateNode", msg: "The workspace does not exist" }, data.silent);

	var node = lookupNode(ws, data._id);
	if (!node) return fail({ kind: "updateNode", msg: "Node with given id does not exist", workspace_id: data.workspace_id, _id: data._id });

	if ( node.typeName != data.typeName ) 
		return fail({ kind: "updateNode", msg: "Cannot change the type of a node", workspace_id: data.workspace_id, _id: data._id, 
			current_type_name: node.typeName, requested_type_name: data.typeName });

	node.replication = data.replication;
	if ( data.lastValue != undefined ) node.lastValue = data.lastValue;
	node.extend( data.extra );

	for (var i = 0; i < node.inputs.length; i++){
		node.inputs[i].useDefault = data.ignoreDefaults[i] != undefined ? !data.ignoreDefaults[i] : true;
	}

	node.setDirty();

	return success({ kind: "updateNode", workspace_id: data.workspace_id, _id: data._id }, data.silent);

};

on_addNode = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "addNode", msg: "The workspace does not exist" }, data.silent);

	var id = lookupNodeIndex(ws, data._id);
	if (!(id < 0)) return fail({ kind: "addNode", msg: "Node with given id already exists", workspace_id: data.workspace_id, _id: data._id });

	if ( !FLOOD.nodeTypes[data.typeName] && !FLOOD.internalNodeTypes[data.typeName] ) 
		return fail({ kind: "addNode", msg: "Node with that name does not exist", typeName: data.typeName, workspace_id: data.workspace_id, _id: data._id });

	var type = FLOOD.nodeTypes[ data.typeName ] || FLOOD.internalNodeTypes[ data.typeName ];

	var node = new type();

	node.id = data._id;
	node.replication = data.replication;
	node.lastValue = data.lastValue;
	node.evalComplete = post_nodeEvalComplete;
	node.evalBegin = post_nodeEvalBegin;
	node.evalFailed = post_nodeEvalFailed;
	if ( data.isClean ) node.setClean();
	node.extend( data.extra );

	for (var i = 0; i < node.inputs.length; i++){
		node.inputs[i].useDefault = data.ignoreDefaults[i] != undefined ? !data.ignoreDefaults[i] : true;
	}

	ws.nodes.push(node);

	return success({ kind: "addNode", workspace_id: data.workspace_id, _id: data._id }, data.silent);

};

on_removeNode = function(data){

	var ws = lookupWorkspace(data.workspace_id);
	if (!ws) return fail({ kind: "removeNode", msg: "The workspace does not exist" }, data.silent);

	var i = lookupNodeIndex(ws, data._id );
	if (i < 0) return fail({ kind: "removeNode", msg: "A node with the given id does not exist." }, data.silent);

	// remove node from the workspace
	ws.nodes.splice(i, 1);

	// delete all connections from the deleted node - effective removing
	// any references to the node
	ws.nodes.forEach(function(n){
		n.inputs.forEach(function(p){
			if ( p.oppNode && p.oppNode.id === data._id ){
				p.disconnect();
			}
		});
	});

	return success({ kind: "removeNode", _id : data._id, workspace_id: data.workspace_id }, data.silent);

};

// set the nodes & connections for a workspace
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

	return success({ kind: "nodeDirty", _id: id });

};

post_nodeEvalBegin = function(node, isNew){

	return success({ kind: "nodeEvalBegin", isNew: isNew, _id: node.id });

};

post_nodeEvalComplete = function(node, args, isNew, value, prettyValue ){

	if (typeof value === "function") {
		value = value.toString();
		prettyValue = value.toString();
	}
	
	if ( isNew ){
		// console.log('copying value', node.typeName );
		return success({ kind: "nodeEvalComplete", isNew : isNew, _id: node.id, value : value, prettyValue: prettyValue  });
	} else {
		// console.log('not copying value', node.typeName );
		return success({ kind: "nodeEvalComplete", isNew : isNew, _id: node.id });
	}

};

post_nodeEvalFailed = function(node, exception){

	console.log( JSON.stringify(exception) )
	return fail({ kind: "nodeEvalFailed", _id: node.id, exception: exception.toString() });

};

// Helpers

function clone (oToBeCloned) {
  if (oToBeCloned === null || !(oToBeCloned instanceof Object)) { return oToBeCloned; }
  var oClone, fConstr = oToBeCloned.constructor;
  switch (fConstr) {
    // implement other special objects here!
    case RegExp:
      oClone = new fConstr(oToBeCloned.source, "g".substr(0, Number(oToBeCloned.global)) + "i".substr(0, Number(oToBeCloned.ignoreCase)) + "m".substr(0, Number(oToBeCloned.multiline)));
      break;
    case Function:
      return oToBeCloned.toString();
    case Date:
      oClone = new fConstr(oToBeCloned.getTime());
      break;
    // etc.
    default:
      oClone = new fConstr();
  }
  for (var sProp in oToBeCloned) { oClone[sProp] = clone(oToBeCloned[sProp]); }
  return oClone;
}

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