var flood = require('../models/Workspace');

/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.example = function(req, res) {

	var m = new flood.SessionModel({ 
		name: "Peter's Session",
		workspaces: [
			new flood.WorkspaceModel({
				name: "Example Workspace"
				, nodes: [
					new flood.NodeModel({"typeName": "Number", "lastValue": 10, "name": "node2", "position": [100,200] }),
					new flood.NodeModel({"typeName": "Number", "lastValue": 16, "name": "node8", "position": [100,350] }),
					new flood.NodeModel({"typeName": "SolidInter", "name": "node10", "position": [1200,200] }),
					new flood.NodeModel({"typeName": "Add", "name": "node5", "position": [500,300] }),
					new flood.NodeModel({"typeName": "Vec3", "name": "node6", "position": [700,300] }),
					new flood.NodeModel({"typeName": "Sphere", "name": "node7", "position": [900,300] }),
					new flood.NodeModel({"typeName": "Cube", "name": "node9", "position": [500,100] }),
					new flood.NodeModel({"typeName": "Watch", "name": "node11", "position": [700,500] }),
					new flood.NodeModel({"typeName": "Watch", "name": "node12", "position": [900,500] })
				]
			})
		]
	});

	res.send(JSON.stringify(m));

};

// get session (for user)
// save session
// login
// logout

// "nodes": [
// 				{"_id": 6, "typeName": "Number", "lastValue": 10, "name": "node2", "position": [100,200] },
// 				{"_id": 12, "typeName": "Number", "lastValue": 16, "name": "node8", "position": [100,350] },
// 				{"_id": 13, "typeName": "SolidInter", "name": "node10", "position": [1200,200] },
// 				{"_id": 8, "typeName": "Add", "name": "node5", "position": [500,300] },
// 				{"_id": 9, "typeName": "Vec3", "name": "node6", "position": [700,300] },
// 				{"_id": 10, "typeName": "Sphere", "name": "node7", "position": [900,300] },
// 				{"_id": 11, "typeName": "Cube", "name": "node9", "position": [500,100] },
// 				{"_id": 14, "typeName": "Watch", "name": "node11", "position": [700,500] },
// 				{"_id": 15, "typeName": "Watch", "name": "node12", "position": [900,500] }
// 			],
// 		  "connections": [
// 		  		{"_id": 1, "startNodeId": 6, "endNodeId": 11, "endPortIndex": 1},
// 		  		{"_id": 2, "startNodeId": 6, "endNodeId": 8, "endPortIndex": 1},
// 		  		{"_id": 3, "startNodeId": 8, "endNodeId": 9, "endPortIndex": 2},
// 		  		{"_id": 4, "startNodeId": 9, "endNodeId": 10, "endPortIndex": 0},
// 		  		{"_id": 5, "startNodeId": 12, "endNodeId": 8, "endPortIndex": 0},
// 		  		{"_id": 6, "startNodeId": 11, "endNodeId": 13, "endPortIndex": 0},
// 		  		{"_id": 7, "startNodeId": 10, "endNodeId": 13, "endPortIndex": 1},
// 		  		{"_id": 8, "startNodeId": 8, "endNodeId": 14, "endPortIndex": 0},
// 		  		{"_id": 9, "startNodeId": 9, "endNodeId": 15, "endPortIndex": 0}
// 			]