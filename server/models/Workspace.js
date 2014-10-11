var mongoose = require('mongoose')  
  , Schema = mongoose.Schema;

var sessionSchema = new Schema({
  name: { type: String, default: '' }
  , currentWorkspace: {type: Schema.ObjectId, ref: 'Workspace' }
  , workspaces: [ {type: Schema.ObjectId, ref: 'Workspace' } ]
  , lastSaved: Date
  , isFirstExperience: { type: Boolean, default: true }
});

var workspaceSchema = new Schema({
  name: { type: String, default: '' }
  , nodes: [ Schema.Types.Mixed ]
  , connections: [ Schema.Types.Mixed ]
  , selectedNodes: [ Schema.Types.Mixed ]
  , isPublic: { type: Boolean, default: false }
  , zoom: { type: Number, default: 1 }
  , offset: [{ type: Number }]
  , lastSaved: Date
  , maintainers: [{type: Schema.ObjectId, ref: 'User' }]
  , undoStack: [ Schema.Types.Mixed ]
  , redoStack: [ Schema.Types.Mixed ]
  , isModified: { type: Boolean, default: false }
  , isCustomNode: { type: Boolean, default: false }
  , isCustomizer: { type: Boolean, default: false }
  , workspaceDependencyIds: [{type: Schema.ObjectId, ref: 'Workspace' }]
});

exports.SessionModel = mongoose.model('Session', sessionSchema);
exports.WorkspaceModel = mongoose.model('Workspace', workspaceSchema);