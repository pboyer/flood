define(['backbone', 'Workspaces', 'Node'], function(Backbone, Workspaces, Node){

  return Backbone.Model.extend({

    idAttribute: "_id",

    url: function() {
      return '/my_session';
    },

    toJSON : function() {

        if (this._isSerializing) {
            return this.id || this.cid;
        }

        this._isSerializing = true;

        var json = _.clone(this.attributes);

        _.each(json, function(value, name) {
            _.isFunction(value.toJSON) && (json[name] = value.toJSON());
        });

        this._isSerializing = false;

        return json;
    },

    initialize: function(args, options){
      this.on('change:currentWorkspace', this.updateCurrentWorkspace, this);
      this.updateCurrentWorkspace();
    },

    newNodePosition: [0,0],

    defaults: {
      name: "DefaultSession",
      workspaces: new Workspaces(),
      currentWorkspace: null,
      showingSearch: false,
      showingHelp: false
    },

    parse : function(resp) {

      console.log(resp);
      
      this.get('workspaces').add(resp.workspaces, {app: this});
      resp.workspaces = this.get('workspaces');
      return resp;

    },

    makeId: function(){
      return Math.floor(Math.random() * 1e9);
    },

    addNodeToWorkspace: function(name, position, workspaceId ){

      if (workspaceId === undefined ){
        workspaceId = this.get('currentWorkspace');
      }

      if (position === undefined) {
        position = this.newNodePosition;
      }
      
      var currWS = this.get('workspaces').get( workspaceId );
      var newNode = new Node({ typeName: name, position: position, _id: this.makeId() }, {workspace: currWS});

      currWS.get('nodes').add( newNode );
      this.set('showingSearch', false);

    },

    updateCurrentWorkspace: function(){

      if (this.get('workspaces').length === 0)
        return;

      this.get('workspaces').each(function(ele){
        ele.set('current', false);
      });

      if ( this.get('currentWorkspace') === null) {
        var ele = this.get('workspaces').at(0);
        this.set('currentWorkspace', ele.get('_id') );
      } 

      this.get('workspaces').get(this.get('currentWorkspace')).set('current', true);

    },

  });


})




