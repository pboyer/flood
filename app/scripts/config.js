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
        almond: {
            deps: [
            ],
            exports: 'almond'
        }
    },
    paths: {

        // backbone collections
        Connections: 'collections/Connections',
        SearchElements: 'collections/SearchElements',
        Nodes: 'collections/Nodes',
        Workspaces: 'collections/Workspaces',

        // backbone models
        App: 'models/App',
        Connection: 'models/Connection',
        Node: 'models/Node',
        Search: 'models/Search',
        SearchElement: 'models/SearchElement',
        Workspace: 'models/Workspace',
        Help: 'models/Help',

        // backbone routers
        WorkspaceRouter: 'router/WorkspaceRouter',

        // backbone views
        AppView: 'views/AppView',
        ConnectionView: 'views/ConnectionView',
        SearchView: 'views/SearchView',
        WorkspaceSearchView: 'views/WorkspaceSearchView',
        SearchElementView: 'views/SearchElementView',
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
        almond: '../bower_components/almond/almond',
        List: '../bower_components/listjs/dist/list.min',
        Three: '../bower_components/threejs/build/three.min',
        jqueryuidraggable: '../bower_components/jquery.ui/ui/jquery.ui.draggable',
        jqueryuicore: '../bower_components/jquery.ui/ui/jquery.ui.core',
        jqueryuimouse: '../bower_components/jquery.ui/ui/jquery.ui.mouse',
        jqueryuiwidget: '../bower_components/jquery.ui/ui/jquery.ui.widget',
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
    }

});



