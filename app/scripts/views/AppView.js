define([  'backbone', 
          'App', 
          'WorkspaceView', 
          'Search', 
          'SearchView', 
          'WorkspaceSearchView', 
          'WorkspaceTabView', 
          'Workspace',
          'WorkspaceBrowser',
          'WorkspaceBrowserView',
          'HelpView',
          'Help',
          'LoginView',
          'Login'], 
          function(Backbone, App, WorkspaceView, Search, SearchView, WorkspaceSearchView, WorkspaceTabView, Workspace, WorkspaceBrowser, WorkspaceBrowserView, HelpView, Help, LoginView, Login) {

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
      this.model.on('change:showingBrowser', this.viewBrowser, this);

      $(document).bind('keydown', $.proxy( this.keydownHandler, this) );

    },

    events: {
      'click #save-button' : 'saveClick',
      'click .workspaces_curtain' : 'endSearch',
      'click #help-button': 'showHelp',
      'click #settings-button': 'showSettings',
      'click #workspace_hide' : 'toggleViewer',
      'click #add-workspace-button': 'newWorkspace',
      'click #workspace-browser-button': 'toggleBrowser'
    },

    keydownHandler: function(e){
      
      this.currentWorkspaceView.keydownHandler(e);

    },

    saveClick: function(e){
      this.model.sync("update", this.model);
    },  

    endSearch: function() {
      this.model.set('showingSearch', false);
    },

    toggleBrowser: function(e){

      if (this.model.get('showingBrowser') === true){
        $(e.currentTarget).removeClass('workspace-browser-button-active');
        this.model.set('showingBrowser', false);
      } else {
        $(e.currentTarget).addClass('workspace-browser-button-active');
        this.model.set('showingBrowser', true);
      }

    },

    viewBrowser: function(){
      if (!this.browserView){
        this.browserView = new WorkspaceBrowserView({model: new WorkspaceBrowser() }, { app: this.model });
        this.browserView.render();
      }

      if (this.model.get('showingBrowser') === true){
        this.browserView.$el.show();  
      } else {
        this.browserView.$el.hide();
      }
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

    showHelp: function(){
      this.model.set('showingHelp', true);
    },

    hideHelp: function(){
      this.model.set('showingHelp', true);
    },

    showLogin: function(){
      this.model.set('showingLogin', true);
    },

    showSettings: function(){
      this.model.showSettings();
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
    showingBrowser: false,
    showingSettings: false,
    showingSearch: false,
    showingLogin: false,

    currentWorkspaceView: null,
    currentWorkspaceId: null,
    workspaceTabViews: {},
    workspaceViews: {},

    workspaceCounter: 1,

    newWorkspace: function(){
      this.model.newWorkspace();
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
          var that = this;
          this.newWorkspace();
        }
      }

      this.workspaceTabViews[workspace.get('_id')].$el.remove();
      delete this.workspaceTabViews[workspace.get('_id')];

    },

    getWorkspaceView: function(workspaceModel) {

      if (!workspaceModel) return;

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
        // this.model.set('currentWorkspace', currentWorkspace.get('_id'));
      } else {
        var currentWorkspace = workspaces.get(currentWorkspaceId);
      }
      
      this.model.updateCurrentWorkspace();
    
      // render search
        if (!this.workspaceSearchView){

          this.workspaceSearchView = new WorkspaceSearchView( { model: new Search() }, {app: this.model, appView : this } );
          this.workspaceSearchView.render();
          this.$el.find('#workspaces').prepend(this.workspaceSearchView.$el);

        }

      // render tabs
        if (!this.workspaceTabViews){
          this.workspaceTabViews = {};
          workspaces.each(this.addWorkspaceTab, this);
        }

      // hide current workspace, show workspace

        if (this.model.changed.currentWorkspace && currentWorkspace){

          this.hideWorkspace(this.currentWorkspaceView);
          this.currentWorkspaceView = this.getWorkspaceView( currentWorkspace );

          this.showWorkspace( this.currentWorkspaceView );
          this.currentWorkspaceView.render();
          this.currentWorkspaceId = currentWorkspaceId;
          this.focusWorkspace();
        }

      this.showSearch();
      this.renderLogin();

      return this;

    },

    renderLogin: function(){
      if (!this.loginView){
        this.loginView = new LoginView({model: this.model.login }, { app: this.model });
        this.loginView.render();
      }
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

    getCurrentWorkspace: function(){
      return this.get('workspaces').get(this.get('currentWorkspace'));
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





