define([  'backbone', 
          'App', 
          'WorkspaceView', 
          'Search', 
          'SearchView', 
          'WorkspaceSearchView', 
          'WorkspaceTabView', 
          'Workspace',
          'HelpView',
          'Help' ], 
          function(Backbone, App, WorkspaceView, Search, SearchView, WorkspaceSearchView, WorkspaceTabView, Workspace, HelpView, Help) {

  return Backbone.View.extend({

    el: '#app',

    initialize: function() { 
      
      this.listenTo(this.model, 'change', this.render);
      this.$workspace_tabs = this.$('#workspace-tabs');

      this.model.get('workspaces').on('add', this.addWorkspaceTab, this);
      this.model.get('workspaces').on('remove', this.removeWorkspaceTab, this);

      this.model.on('change:showingSettings', this.viewSettings, this);
      this.model.on('change:showingLogin', this.viewLogin, this);
      this.model.on('change:showingHelp', this.viewHelp, this);

    },

    events: {
      'click #save-button' : 'saveClick',
      'click .workspaces_curtain' : 'endSearch',
      'click #help-button': 'showHelp',
      'click #settings-button': 'showSettings',
      'click #login-button': 'showLogin',
      'click #workspace_hide' : 'toggleViewer',
      'click #add-workspace-button': 'newWorkspace'
    },

    saveClick: function(e){
      console.log('save!');
      this.model.sync("update", this.model );
    },  

    endSearch: function() {
      this.model.set('showingSearch', false);
    },

    viewHelp: function(){
      if (!this.helpView){
        this.helpView = new HelpView({model: new Help() }, { app: this.model });
        this.helpView.render();
      }

      if (this.model.get('showingHelp') === true){
        this.helpView.$el.show();  
      } else {
        this.helpView.$el.hide();
      }
    },

    viewLogin: function(){

    },

    viewSettings: function(){

    },

    showHelp: function(){
      this.model.set('showingHelp', true);
    },

    hideHelp: function(){
      this.model.set('showingHelp', true);
    },

    showSettings: function(){
      this.model.showSettings();
    },

    showLogin: function(){
      this.model.showLogin();
    },

    showSearch: function() {

      if (this.model.get('showingSearch') === true) {
        
        // darken the workspace container
        this.$el.find('.workspaces_curtain').css('display', 'block');

        // if we haven't already, create the search view element and add to the ui
        if (this.searchView === undefined){
          this.searchView = new SearchView( { model: new Search() }, {app: this.model } );
          this.searchView.render();
          this.$el.find('#workspaces').prepend(this.searchView.$el);

        } else {
          this.searchView.$el.css('display', 'block');
        }

        $('.workspace_container').addClass('blur');
        this.searchView.$el.find('.library-search-input').focus();

      } else {

        $('.workspace_container').removeClass('blur');
        
        this.$el.find('.workspaces_curtain').css('display', 'none');
        if (this.searchView != undefined) {
          this.searchView.$el.css('display', 'none');
        }

      }

    },

    showingHelp: false,
    showingSettings: false,
    showingSearch: false,
    showingLogin: false,

    currentWorkspaceView: null,
    currentWorkspaceId: null,
    workspaceTabViews: {},
    workspaceViews: {},

    workspaceCounter: 1,

    newWorkspace: function(){

      // only create workspace once that's been assigned
      // drawback - somewhat slow
      // means you can't create a workspace without being connected

      // don't worry about this quite yet


      var newWorkspace = new Workspace({ _id: this.model.makeId(), name: 'New Workspace ' + this.workspaceCounter++ }, {app: this.model});
      this.model.get('workspaces').add( newWorkspace );
      return newWorkspace;

    },

    // This callback is called when a Workspace is added to
    // the App's Workspace Collection
    addWorkspaceTab: function(workspace){

      var view = new WorkspaceTabView({ model: workspace });
      this.workspaceTabViews[workspace.get('_id')] = view;

      view.render();
      this.$workspace_tabs.append( view.$el );

    },

    // Function is called when a workspace is removed from the 
    // App's Workspace Collection
    removeWorkspaceTab: function(workspace){

      // The Workspace can no longer be current
      workspace.set('current', false);

       // check if the removed workspace is the current one
      if (workspace.get('_id') == this.model.get('currentWorkspace') ){

        // are there any more workspaces?
        if ( this.model.get('workspaces').length != 0 ){
          this.model.set('currentWorkspace', this.model.get('workspaces').first().get('_id') );

        // if we're out of workspaces, just add a new one
        } else {
          var newWorkspace = this.newWorkspace();
          this.model.set('currentWorkspace', newWorkspace.get('_id') );
        }
      }

      this.workspaceTabViews[workspace.get('_id')].$el.remove();
      delete this.workspaceTabViews[workspace.get('_id')];

    },

    getWorkspaceView: function(workspaceModel) {

      var workspaceId = workspaceModel.get('_id');

      if ( !this.workspaceViewIsInstantiated( workspaceId )){

        var workspaceView = new WorkspaceView( {
                model: workspaceModel,
                app: this
            });
          
        this.workspaceViews[workspaceId] = workspaceView;

      } else {
        var workspaceView = this.workspaceViews[ workspaceId ];
      }

      return workspaceView;
    },

    workspaceViewIsInstantiated: function(workspaceId){
      return (this.workspaceViews[workspaceId] != undefined);
    },

    hideWorkspace: function(workspaceView){
      if (workspaceView != undefined)
        workspaceView.$el.hide();
    },

    showWorkspace: function(workspaceView){

      if (!$.contains(document.documentElement, workspaceView.$el[0])){
        this.$el.children('#workspaces').append( this.currentWorkspaceView.$el );
      }
      
      workspaceView.$el.show();
      
    },

    render: function(arg) {

      var workspaces = this.model.get('workspaces')
      var currentWorkspaceId = this.model.get('currentWorkspace');

      if (!currentWorkspaceId){
        var currentWorkspace = workspaces.first();
        this.model.set('currentWorkspace', currentWorkspace.get('_id'));
        console.log("Setting new workspace");
      } else {
        var currentWorkspace = workspaces.get(currentWorkspaceId);
      }
      
      currentWorkspace.set('current', true);
      this.model.updateCurrentWorkspace();
    
      // render search
        if (!this.workspaceSearchView){

          this.workspaceSearchView = new WorkspaceSearchView( { model: new Search() }, {app: this.model } );
          this.workspaceSearchView.render();
          this.$el.find('#workspaces').prepend(this.workspaceSearchView.$el);

        }

      // render tabs
        if (!this.workspaceTabViews){
          this.workspaceTabViews = {};
          workspaces.each(this.addWorkspaceTab, this);
        }

      // hide current workspace, show workspace

        if (this.model.changed.currentWorkspace){
          this.hideWorkspace(this.currentWorkspaceView);
          this.currentWorkspaceView = this.getWorkspaceView( currentWorkspace );
          this.showWorkspace( this.currentWorkspaceView );
          this.currentWorkspaceView.render();
          this.currentWorkspaceId = currentWorkspaceId;
          this.focusWorkspace();
        }

      // render search
      this.showSearch();

    },


    lookingAtViewer: false,

    focusWorkspace: function(){

      this.$el.find('#workspace_hide').removeClass('leftside');
      this.$el.find('#workspace_hide').addClass('rightside');

      this.$el.find('#workspace_hide i').removeClass('icon-arrow-right');
      this.$el.find('#workspace_hide i').addClass('icon-arrow-left');

      // change whether workspace_container is visible or not
      this.currentWorkspaceView.$el.show();
      this.workspaceSearchView.$el.show();

      $('#viewer').addClass('blur');
    },

    focusViewer: function(){

      this.$el.find('#workspace_hide').addClass('leftside');
      this.$el.find('#workspace_hide').removeClass('rightside');

      this.$el.find('#workspace_hide i').removeClass('icon-arrow-left');
      this.$el.find('#workspace_hide i').addClass('icon-arrow-right');

      this.currentWorkspaceView.$el.hide();
      this.workspaceSearchView.$el.hide();

      $('#viewer').removeClass('blur');

    },

    toggleViewer: function(event) {

      this.lookingAtViewer = !this.lookingAtViewer;

      if ( this.lookingAtViewer ){
        this.focusViewer();
      } else {
        this.focusWorkspace();
      }

    }

  });
});





