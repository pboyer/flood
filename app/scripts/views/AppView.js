define([  'backbone', 
          'App', 
          'WorkspaceView', 
          'Search', 
          'SearchView', 
          'WorkspaceControlsView', 
          'WorkspaceTabView', 
          'Workspace',
          'WorkspaceBrowser',
          'WorkspaceBrowserView',
          'HelpView',
          'Help',
          'LoginView',
          'Login',
          'FeedbackView',
          'Feedback' ], 
          function(Backbone, App, WorkspaceView, Search, SearchView, WorkspaceControlsView, 
            WorkspaceTabView, Workspace, WorkspaceBrowser, WorkspaceBrowserView, HelpView, 
            Help, LoginView, Login, FeedbackView, Feedback ) {

  return Backbone.View.extend({

    el: '#app',

    initialize: function() { 
      
      this.listenTo(this.model, 'change', this.render);
      this.$workspace_tabs = this.$('#workspace-tabs');

      this.model.get('workspaces').on('add', this.addWorkspaceTab, this);
      this.model.get('workspaces').on('remove', this.removeWorkspaceTab, this);

      this.model.on('change:showingSettings', this.viewSettings, this);
      this.model.on('change:showingFeedback', this.viewFeedback, this);
      this.model.on('change:showingHelp', this.viewHelp, this);
      this.model.on('change:showingBrowser', this.viewBrowser, this);

      this.model.login.on('change:isLoggedIn', this.showHelpOnFirstExperience, this );
      this.model.login.on('change:showing', this.showHelpOnFirstExperience, this );

      $(document).bind('keydown', $.proxy( this.keydownHandler, this) );

      // deactivate the context menu
      $(document).bind("contextmenu",function(e){ return false; });

    },

    events: {
      'click #save-button' : 'saveClick',
      'click .workspaces_curtain' : 'endSearch',
      'click #help-button': 'showHelp',
      'click #settings-button': 'showSettings',
      'click #workspace_hide' : 'toggleViewer',
      'click #workspace-browser-button': 'toggleBrowser',
      'click #feedback-button': 'showFeedback',

      'click #add-project-workspace' : 'newWorkspace',
      'click #add-node-workspace' : 'newNodeWorkspace',

      'mouseover #add-workspace-button': 'showAddWorkspaceSelect',
      'mouseout #add-workspace-button': 'hideAddWorkspaceSelect',
      'mouseover #add-workspace-select-element': 'showAddWorkspaceSelect',
      'mouseout #add-workspace-select-element': 'hideAddWorkspaceSelect',
    },

    showHelpOnFirstExperience: function(){

      var that = this;

      if (that.model.login.get('isLoggedIn')  && that.model.get('isFirstExperience')){
        setTimeout(function(){
          that.model.set( 'showingHelp', true);
          that.model.set( 'isFirstExperience', false );
         }, 800);
      } else {
        that.model.set( 'showingHelp', false);
      }

    },

    showAddWorkspaceSelect: function(){
      $('#add-workspace-select-element').show();
    },

    hideAddWorkspaceSelect: function(){
      $('#add-workspace-select-element').hide();
    },

    newWorkspace: function(){
      this.model.newWorkspace();
      this.hideAddWorkspaceSelect();
    },

    newNodeWorkspace: function(){
      this.model.newNodeWorkspace();
      this.hideAddWorkspaceSelect();
    },

    keydownHandler: function(e){

      var isBackspaceOrDelete = e.keyCode === 46 || e.keyCode === 8;

      if ( !(e.metaKey || e.ctrlKey) && !isBackspaceOrDelete ) return;

      // do not capture from input
      if (e.originalEvent.srcElement && e.originalEvent.srcElement.nodeName === "INPUT") return;
      if (e.target.nodeName === "INPUT") return;

      // keycodes: http://css-tricks.com/snippets/javascript/javascript-keycodes/
      switch (e.keyCode) {
        case 78:
          this.newWorkspace();
          return e.preventDefault();
      }

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
      }
      
      if (this.model.get('showingHelp') === true){
        // the workspace must be focused before showing help
        this.focusWorkspace();
        this.helpView.render();
        this.helpView.$el.fadeIn();  
      } else {
        this.helpView.$el.fadeOut();
      }
    },

    viewFeedback: function(){
      if (!this.feedbackView){
        this.feedbackView = new FeedbackView({model: new Feedback() }, { app: this.model });
        this.feedbackView.render();
      }

      if (this.model.get('showingFeedback') === true){
        this.feedbackView.$el.fadeIn();  
      } else {
        this.feedbackView.$el.fadeOut();
      }
    },

    showHelp: function(){
      this.model.set('showingHelp', true);
    },

    hideHelp: function(){
      this.model.set('showingHelp', true);
    },

    showFeedback: function(){
      this.model.set('showingFeedback', true);
    },

    hideFeedback: function(){
      this.model.set('showingFeedback', true);
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

    addWorkspaceTab: function(workspace){

      if ( this.model.isBackgroundWorkspace(workspace.id) ) return;

      if ( this.workspaceTabViews[workspace.get('_id')] != undefined) return;

      var view = new WorkspaceTabView({ model: workspace });
      this.workspaceTabViews[workspace.get('_id')] = view;

      view.render();
      this.$workspace_tabs.append( view.$el );

    },

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

      // if the workspace tab does not exist
      this.model.removeWorkspaceFromBackground( workspaceView.model.id );
      this.addWorkspaceTab( workspaceView.model );

      if (!$.contains(document.documentElement, workspaceView.$el[0])){
        this.$el.children('#workspaces').append( this.currentWorkspaceView.$el );
      }
      
      workspaceView.$el.show();

    },

    render: function(arg) {

      var model = this.model;
      var workspaces = this.model.get('workspaces')
      var currentWorkspaceId = this.model.get('currentWorkspace');

      if (!currentWorkspaceId){
        var currentWorkspace = workspaces.first();
      } else {
        var currentWorkspace = workspaces.get(currentWorkspaceId);
      }
      
      this.model.updateCurrentWorkspace();
    
      // render search
        if (!this.workspaceControlsView){

          this.workspaceControlsView = new WorkspaceControlsView( { model: new Search() }, {app: this.model, appView : this } );
          this.workspaceControlsView.render();

          this.$el.find('#workspaces').prepend( this.workspaceControlsView.$el );

        }

      // render tabs
        if (!this.workspaceTabViews){
          this.workspaceTabViews = {};

          workspaces.each( this.addWorkspaceTab, this );
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
      this.workspaceControlsView.$el.show();

      $('#viewer').addClass('blur');
    },

    focusViewer: function(){

      this.$el.find('#workspace_hide').addClass('leftside');
      this.$el.find('#workspace_hide').removeClass('rightside');

      this.$el.find('#workspace_hide i').removeClass('icon-arrow-left');
      this.$el.find('#workspace_hide i').addClass('icon-arrow-right');

      this.currentWorkspaceView.$el.hide();
      this.workspaceControlsView.$el.hide();

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





