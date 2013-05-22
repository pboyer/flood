define([  'backbone', 
          'App', 
          'WorkspaceView', 
          'Search', 
          'SearchView', 
          'WorkspaceTabView', 
          'Workspace',
          'HelpView',
          'Help'], 
          function(Backbone, App, WorkspaceView, Search, SearchView, WorkspaceTabView, Workspace, HelpView, Help) {

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
      'click .workspaces_curtain' : 'endSearch',
      'click #help-button': 'showHelpClick',
      'click #settings-button': 'settingsClick',
      'click #login-button': 'loginClick',
      'click #workspace_hide' : 'toggleViewer',
      'click #add-workspace-button': 'newWorkspace'
    },

    endSearch: function() {
      this.model.set('searching', false);
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

    showHelpClick: function(){
      this.model.set('showingHelp', true);
    },

    hideHelpClick: function(){
      this.model.set('showingHelp', true);
    },

    settingsClick: function(){
      this.model.showSettings();
      console.log('set me');
    },

    loginClick: function(){
      this.model.showLogin();
      console.log('log me in')
    },

    showingHelp: false,
    showingSettings: false,
    showingSearch: false,
    showingLogin: false,

    currentWorkspaceView: null,
    currentWorkspaceId: null,
    workspaceTabViews: {},
    workspaceViews: {},

    newWorkspace: function(){

      this.model.get('workspaces').add( new Workspace({_id: this.model.makeId() }, {app: this.model}) );

    },

    addWorkspaceTab: function(workspace){

      var view = new WorkspaceTabView({ model: workspace });
      this.workspaceTabViews[workspace.get('_id')] = view;

      view.render();
      this.$workspace_tabs.append( view.$el );

    },

    removeWorkspaceTab: function(workspace){
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
      var currentWorkspace = workspaces.get(currentWorkspaceId);

      currentWorkspace.set('current', true);

      this.model.updateCurrentWorkspace();

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

    showSearch: function() {

      if (this.model.get('searching') === true) {
        
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

    // updateZoom: function() {
    //   var inputVal = this.$el.find('#workspace-zoom-slider').val()
    //     , val = parseFloat( inputVal )
    //     , val = isNaN(val) ? 0 : val;=-

    //   this.currentWorkspaceView.model.set('zoom', val);
    // },

    lookingAtViewer: false,

    focusWorkspace: function(){
      this.$el.find('#workspace_hide').removeClass('leftside');
      this.$el.find('#workspace_hide').addClass('rightside');

      // change whether workspace_container is visible or not
      this.currentWorkspaceView.$el.show();

      $('#viewer').addClass('blur');
    },

    focusViewer: function(){

      this.$el.find('#workspace_hide').addClass('leftside');
      this.$el.find('#workspace_hide').removeClass('rightside');

      this.currentWorkspaceView.$el.hide();

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





