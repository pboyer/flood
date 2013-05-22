/*global require*/
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        List: {
            deps: [
                'jquery'
            ],
            exports: 'List'
        },
        Three: {
            exports: 'Three'
        },
        CSG: {
            exports: 'CSG'
        },
        FCSG: {
            deps: ['CSG'],
            exports: 'FCSG'
        },
        ThreeCSG: {
            deps: ['Three', 'CSG'],
            exports: 'ThreeCSG'
        },
        FThree: {
            deps: [
                'Three',
                'TrackballControls'
            ],
            exports: 'FThree'
        },
        TrackballControls: {
            deps: [
                'Three'
            ],
            exports: 'TrackballControls'
        },
        jqueryuidraggable: {
            deps: [
                'jquery',
                'jqueryuimouse',
                'jqueryuicore',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuidraggable'
        },
        jqueryuimouse: {
            deps: [
                'jquery',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuimouse'
        },
        jqueryuicore: {
            deps: [
                'jquery'
            ],
            exports: 'jqueryuicore'
        },
        jqueryuiwidget: {
            deps: [
                'jquery'
            ],
            exports: 'jqueryuiwidget'
        },
        zoomooz: {
            deps: [
                'jquery'
            ],
            exports: 'zoomooz'
        }
    },
    paths: {

        // backbone collections
        Connections: 'collections/Connections',
        LibraryElements: 'collections/LibraryElements',
        Nodes: 'collections/Nodes',
        Workspaces: 'collections/Workspaces',

        // backbone models
        App: 'models/App',
        Connection: 'models/Connection',
        LibraryElement: 'models/LibraryElement',
        Node: 'models/Node',
        Search: 'models/Search',
        Workspace: 'models/Workspace',
        Help: 'models/Help',

        // backbone routers
        WorkspaceRouter: 'router/WorkspaceRouter',

        // backbone views
        AppView: 'views/AppView',
        ConnectionView: 'views/ConnectionView',
        LibraryElementView: 'views/LibraryElementView',
        SearchView: 'views/SearchView',
        WorkspaceView: 'views/WorkspaceView',
        WorkspaceTabView: 'views/WorkspaceTabView',
        HelpView: 'views/HelpView',

        // node backbone views
        NodeViewTypes: 'views/NodeViews/NodeViews',
        BaseNodeView: 'views/NodeViews/Base',
        WatchNodeView: 'views/NodeViews/Watch',
        NumNodeView: 'views/NodeViews/Num',

        CSGNodeView: 'views/NodeViews/ThreeCSG',

        TrackballControls: 'lib/TrackballControls',
        FThree: 'lib/3d',
        ThreeCSG: 'lib/ThreeCSG',
        FCSG: 'lib/flood/flood_csg',
        FLOOD: 'lib/flood/flood',
        CSG: 'lib/csg',
        scheme: 'lib/flood/scheme',

        // bower
        List: '../bower_components/listjs/list.min',
        Three: '../bower_components/threejs/build/three.min',
        jqueryuidraggable: '../bower_components/jquery.ui/ui/jquery.ui.draggable',
        jqueryuicore: '../bower_components/jquery.ui/ui/jquery.ui.core',
        jqueryuimouse: '../bower_components/jquery.ui/ui/jquery.ui.mouse',
        jqueryuiwidget: '../bower_components/jquery.ui/ui/jquery.ui.widget',
        jquery: '../bower_components/jquery/jquery',
        zoomooz: 'lib/zoomooz',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
    }


});


require(['backbone', 'App', 'LibraryElements', 'AppView', 'Three', 'FThree', 'FCSG', 'ThreeCSG', 'zoomooz'], function (Backbone, App, LibraryElements, AppView) {

  var app = new App();

  app.fetch({ 
    success: function() {
        console.log('success')
      }, 
    error: function(ok) {
      console.log('error')
      console.log(ok)
    }
  });

  app.LibraryElements = new LibraryElements({app:app});
  app.LibraryElements.fetch();
  
  new AppView({model: app});

  // Backbone.history.start();

});


