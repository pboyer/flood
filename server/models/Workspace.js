var mongoose = require('mongoose')  
  , Schema = mongoose.Schema;

var sessionSchema = new Schema({
  name: { type: String, default: '' }
  , currentWorkspace: {type: Schema.ObjectId, ref: 'Workspace' }
  , workspaces: [ {type: Schema.ObjectId, ref: 'Workspace' } ]
  , lastSaved: Date
});

var workspaceSchema = new Schema({
  name: { type: String, default: '' }
  , nodes: [ Schema.Types.Mixed ]
  , connections: [ Schema.Types.Mixed ]
  , selectedNodes: [ Schema.Types.Mixed ]
  , zoom: Number
  , lastSaved: Date
});

exports.SessionModel = mongoose.model('Session', sessionSchema);
exports.WorkspaceModel = mongoose.model('Workspace', workspaceSchema);