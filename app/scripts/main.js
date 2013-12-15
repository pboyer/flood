// Break out the application running from the configuration definition to
// assist with testing.
require(["config"], function() {

    require(['backbone', 'App', 'LibraryElements', 'AppView', 'Three', 'FThree', 'FCSG', 'ThreeCSG'], function (Backbone, App, LibraryElements, AppView) {

      var app = new App();

      app.fetch({
        error: function(result) {
          console.error('error')
          console.error(result)
        }
      });

      app.LibraryElements = new LibraryElements({app:app});
      app.LibraryElements.fetch();

      var appView = new AppView({model: app});

      // var workspace = appView.newWorkspace();
      // app.set('currentWorkspace', workspace.get('_id'));

      // Backbone.history.start();

    });

});