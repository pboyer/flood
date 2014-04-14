// Break out the application running from the configuration definition to
// assist with testing.
require(["config"], function() {

  require(['backbone', 'App', 'SearchElements', 'AppView', 'Three', 'FThree', 'FCSG', 'ThreeCSG', 'bootstrap'], function (Backbone, App, SearchElements, AppView) {

    var app = new App();

    app.fetch({
      error: function(result) {
        console.error('error')
        console.error(result)
      }
    });

    app.SearchElements = new SearchElements({app:app});
    app.SearchElements.fetch();

    var appView = new AppView({model: app});

  });

});