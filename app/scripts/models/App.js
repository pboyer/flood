define(['backbone', 'Workspaces', 'Node', 'Login', 'Workspace', 'SearchElements'], 
    function(Backbone, Workspaces, Node, Login, Workspace, SearchElements){

  return Backbone.Model.extend({

    idAttribute: "_id",

    url: function() {
      return '/mys';
    },

    initialize: function(args, options){
      this.on('change:currentWorkspace', this.updateCurrentWorkspace, this);
      this.updateCurrentWorkspace();

      this.login = new Login({}, { app: this });

      this.SearchElements = new SearchElements({app:this});
      this.SearchElements.fetch();
    },

    newNodePosition: [0,0],

    defaults: {
      name: "DefaultSession",
      workspaces: new Workspaces(),
      currentWorkspace: null,
      showingBrowser: false,
      showingSearch: false,
      showingHelp: false
    },

    parse : function(resp) {

      // TODO: don't leave user with no workspaces at anytime!
      var old = this.get('workspaces').slice();
      this.get('workspaces').add(resp.workspaces, {app: this});
      this.get('workspaces').remove(old);

      resp.workspaces = this.get('workspaces');
      return resp;

    },

    fetch : function(options){

      this.login.fetch();
      Backbone.Model.prototype.fetch.apply(this, options);
      
    },

    // override of toJSON to support recursive serialization 
    // of child attributes
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

    makeId: function(){
      return Math.floor(Math.random() * 1e9);
    },

    addNodeToWorkspace: function(name, position, workspaceId ){

      if (workspaceId === undefined ){
        workspaceId = this.get('currentWorkspace');
        console.log(workspaceId);
      }

      if (position === undefined) {
        position = this.newNodePosition;
      }
      
      var ws = this.get('workspaces').get( workspaceId );
      ws.addNode({ typeName: name, position: position, _id: this.makeId() });

      this.set('showingSearch', false);

    },

    newWorkspace: function( callback ){

      var that = this;

      $.get("/nws", function(data, status){

        var ws = new Workspace(data, {app: that });
        that.get('workspaces').add( ws );
        that.set('currentWorkspace', ws.get('_id') );
        if (callback) callback( ws );

      }).fail(function(){

        console.error("failed to get new workspace");

      });

    },

    openWorkspace: function( id, callback ){

      var ws = this.get('workspaces').get(id);
      if ( ws ){
        this.set('currentWorkspace', id);
      }

      var that = this;

      $.get("/ws/" + id, function(data, status){

        var ws = new Workspace(data, {app: that});
        that.get('workspaces').add( ws );
        that.set('currentWorkspace', ws.get('_id') );
        if (callback) callback( ws );

      }).fail(function(){

        console.error("failed to get workspace with id: " + id);

      });

    },

    updateCurrentWorkspace: function(){

      if (this.get('workspaces').length === 0)
        return;

      this.get('workspaces').each(function(ele){
        ele.set('current', false);
      });

      if ( this.get('currentWorkspace') === null || !this.get('workspaces').get(this.get('currentWorkspace'))) {
        var ele = this.get('workspaces').at(0);
        this.set('currentWorkspace', ele.get('_id') );
      } 

      this.get('workspaces').get(this.get('currentWorkspace')).set('current', true);

    },

  });


})




