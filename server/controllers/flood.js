var mongoose = require('mongoose')
	, Session = require('../models/Workspace').SessionModel
	, Workspace = require('../models/Workspace').WorkspaceModel
	, UserModel = require('../models/User')
	, async = require('async')
	, _ = require('underscore');

var initializeNonUserSession = function(req, res){

	var user = req.user;
	var nws = new Workspace({name : "My first workspace"});
	var newSesh = new Session({name : "Empty session", workspaces : [ nws ]});

	nws.save(function(errWs){

		if (errWs) return res.status(500).send("Failed to initialize user workspace");

		newSesh.save(function(errSesh){
				
				if (errSesh) return res.status(500).send("Failed to initialize user session");

				Session	
					.findById(newSesh.id)
					.populate('workspaces')
					.exec( function(err, sesh){

						if (err || !sesh ) return res.status(500).send("Failed to obtain user session");
						return res.send(sesh);
					});
			});
	});

}

var initializeUserSession = function(req, res){

	var user = req.user;
	var nws = new Workspace({name : "My first workspace"});
	var newSesh = new Session({name : "Empty session", workspaces : [ nws ]});

	nws.save(function(errWs){

		if (errWs) return res.status(500).send("Failed to initialize user workspace");

		newSesh.save(function(errSesh){
				
				if (errSesh) return res.status(500).send("Failed to initialize user session");

				user.lastSession = newSesh;
				user.markModified("lastSession");

				user.save(function(err){
					if (err) return res.status(500).send("Failed to save user session");

					Session	
					.findById(user.lastSession )
					.populate('workspaces')
					.exec( function(err, sesh){

						if (err || !sesh ) return res.status(500).send("Failed to obtain user session");
						return res.send(sesh);
					});
				});
			});
	});
	
};

exports.getMySession = function(req, res) {

	var user = req.user;

	if (!user) {
		return initializeNonUserSession(req,res);
	}

	if (!user.lastSession){
		return initializeUserSession(req, res);
	}	

	Session
	.findById(user.lastSession )
	.populate('workspaces')
	.exec( function(err, sesh){
		if (err || !sesh || !sesh.workspaces || sesh.workspaces.length == 0 ) return initializeUserSession(req, res);
		return res.send(sesh);
	});

};

exports.putMySession = function(req, res) {

	if (!req.body || !req.body._id) return res.status(500).send('Malformed body');

  var ns = req.body;
  var sid = ns._id;

	// build all of the workspace saves
	var workspaceSaves = ns.workspaces.map(function(x){

		return function(callback){

			Workspace.findById(x._id, function(e, w){

				if (e || !w) return callback("Failed to find workspace");

				w.name = x.name || w.name;
				w.nodes = x.nodes || w.nodes;
				w.connections = x.connections || w.connections;
				w.currentWorkspace = x.currentWorkspace || w.currentWorkspace;
				w.selectedNodes = x.selectedNodes || w.selectedNodes;
				w.zoom = x.zoom || w.zoom;
				w.lastSaved = Date.now();

				w.markModified("name nodes connections currentWorkspace selectedNodes zoom lastSaved");

				w.save(function(se){
					if (se) return callback(se);
					return callback();
				});	

			});

		};

	});

	async.waterfall(workspaceSaves, function(err) { 

		if (err) return res.status(500).send(err);

		// save session
		Session.findById( sid, function(e, s) {

			if (e || !s) return res.status(500).send('Invalid session id');

			s.name = ns.name || s.name;

			// TODO: validate ids
			s.workspaces = ns.workspaces.map(function(x){ return x._id; });
			s.currentWorkspace = ns.currentWorkspace; 

			s.lastSaved = Date.now();

			s.markModified('workspaces currentWorkspace lastSave name');

			s.save(function(e){
				if (e) return res.status(500).send("Failed to save session");
				return res.send("Success");
			});

		}); 


	});

};

exports.getNewWorkspace = function(req, res){

	var user = req.user;

	if (!user) return res.status(403).send("Must be logged in to create a new workspace")

	var nws = new Workspace({name : "New workspace", maintainers : [ user._id ] });

	nws.save(function(e){

		if (e) return res.status(500).send("Failed to create new workspace");

		user.workspaces.push(nws);
		user.markModified('workspaces');

		user.save(function(eu){

			if (eu) return res.status(500).send("Failed to update user profile");
			console.log(user)
			return res.send(nws);

		})

	});

};

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

	// TODO: update user

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
  var ns = req.body;

	Session.findById( sid, function(e, s) {

			if (e || !null) {
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