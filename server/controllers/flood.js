var mongoose = require('mongoose')
	, Session = require('../models/flood').SessionModel
	, Workspace = require('./models/flood').WorkspaceModel;

exports.getWorkspace = function(req, res) {

  var wid = req.params.id;

	Workspace.findById( wid , function(e, ws) {

		if (e) {
	  	return res.send('Workspace not found');
		}

		return res.send(ws);
		
	}); 

};

exports.saveWorkspace = function(req, res) {

  var wid = req.params.id;
	var nws = JSON.parse( req.body.workspace );

	Workspace.findById( wid , function(e, ws) {

		if (e) {
	  	return res.status(404).send('Workspace not found');
		}

		ws.name = nws.name || ws.name;
		ws.connections = nws.connections;
		ws.nodes = nws.nodes;

		ws.selectedNodes = nws.selectedNodes;
		ws.zoom = nws.zoom;
		ws.lastSave = Date.now();

		ws.save(function(e){
			if (e) return res.status(500).send("Failed to save workspace")
			return res.send("Success");
		});
		
	}); 

};

exports.getSession = function(req, res) {

  var sid = req.params.id;

	Session.findById( sid )
		.populate('workspaces')
		.exec(function(e, s) {

			if (e) {
		  	return res.status(404).send('Session not found');
			}

			return res.send(s);
			
		}); 

};

exports.saveSession = function(req, res) {

  var sid = req.params.id;
  var ns = JSON.parse( req.body.session );

	Session.findById( sid, function(e, s) {

			if (e) {
		  	return res.status(404).send('Session not found');
			}

			s.name = ns.name || s.name;

			// TODO: validate ids
			s.workspaces = ns.workspaces;
			s.currentWorkspace = ns.currentWorkspace; 

			s.lastSave = Date.now();

			s.save(function(e){
				if (e) return res.status(500).send("Failed to save session")
				return res.send("Success");
			});

		}); 

};