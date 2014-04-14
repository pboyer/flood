var mongoose = require('mongoose')  
  , Schema = mongoose.Schema;

var sessionSchema = new Schema({
  name: { type: String, default: '' }
  , currentWorkspace: {type: Schema.ObjectId, ref: 'Workspace' }
  , workspaces: [ {type: Schema.ObjectId, ref: 'Workspace' } ]
  , lastSave: Date
});

var workspaceSchema = new Schema({
  name: { type: String, default: '' }
  , nodes: [ Schema.Types.Mixed ]
  , connections: [ Schema.Types.Mixed ]
  , selectedNodes: [ Schema.Types.Mixed ]
  , zoom: Number
  , lastSave: Date
});

exports.SessionModel = mongoose.model('Session', sessionSchema);
exports.WorkspaceModel = mongoose.model('Workspace', workspaceSchema);