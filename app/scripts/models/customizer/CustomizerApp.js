define(['backbone', 'App'], 
    function(Backbone, App){

  return App.extend({

    url: function() {

      // get the url from the page
      // customize this url

      return '/cd/';
    },

    parse : function(resp) {

      resp._id = 1;

      this.get('workspaces').add(resp, {app: this});

      var modresp = {};

      modresp.name = resp.name;
      modresp.currentWorkspace = 1;

      return modresp;

    },

    fetch : function(options){

      // this.login.fetch();
      Backbone.Model.prototype.fetch.call(this, options);
      
    },

    enableAutosave: function(){

      // this.get('workspaces').on('add remove', function(){ this.sync("update", this); }, this );
      // this.on('change:currentWorkspace', function(){ this.sync("update", this); }, this);
      // this.on('change:isFirstExperience', function(){ this.sync("update", this); }, this);
      // this.on('change:backgroundWorkspaces', function(){ this.sync("update", this); }, this);

    }

  });

})




