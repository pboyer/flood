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
        FLOODCSG: {
            deps: ['CSG'],
            exports: 'FLOODCSG'
        },
        Viewport: {
            deps: [
                'Three',
                'OrbitControls'
            ],
            exports: 'Viewport'
        },
        OrbitControls: {
            deps: [
                'Three'
            ],
            exports: 'OrbitControls'
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
        jqueryuimouse: {
            deps: [
                'jquery',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuimouse'
        },
        jqueryuitouchpunch: {
            deps: [
                'jquery',
                'jqueryuicore',
                'jqueryuimouse'
            ],
            exports: 'jqueryuitouchpunch'
        },
        jqueryuislider: {
            deps: [
                'jquery',
                'jqueryuitouchpunch',
                'jqueryuimouse',
                'jqueryuicore',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuislider'
        },
        jqueryuidraggable: {
            deps: [
                'jquery',
                'jqueryuitouchpunch',
                'jqueryuimouse',
                'jqueryuicore',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuidraggable'
        },
        bootstrap: {
            deps: [
                'jquery'
            ],
            exports: 'bootstrap'
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
        WorkspaceBrowserElements: 'collections/WorkspaceBrowserElements',

        // backbone models
        App: 'models/App',
        Connection: 'models/Connection',
        Marquee: 'models/Marquee',
        Node: 'models/Node',
        Search: 'models/Search',
        SearchElement: 'models/SearchElement',
        Workspace: 'models/Workspace',
        Runner: 'models/Runner',
        Help: 'models/Help',
        Feedback: 'models/Feedback',
        Login: 'models/Login',
        GeometryExport: 'models/GeometryExport',
        WorkspaceBrowserElement: 'models/WorkspaceBrowserElement',
        WorkspaceBrowser: 'models/WorkspaceBrowser',
        WorkspaceResolver: 'models/WorkspaceResolver',

        // backbone views
        AppView: 'views/AppView',
        ConnectionView: 'views/ConnectionView',
        MarqueeView: 'views/MarqueeView',
        SearchView: 'views/SearchView',
        WorkspaceControlsView: 'views/WorkspaceControlsView',
        SearchElementView: 'views/SearchElementView',
        WorkspaceView: 'views/WorkspaceView',
        WorkspaceTabView: 'views/WorkspaceTabView',
        HelpView: 'views/HelpView',
        FeedbackView: 'views/FeedbackView',
        LoginView: 'views/LoginView',
        WorkspaceBrowserElementView: 'views/WorkspaceBrowserElementView',
        WorkspaceBrowserView: 'views/WorkspaceBrowserView',
        
        // node backbone views
        NodeViewTypes: 'views/NodeViews/NodeViews',
        BaseNodeView: 'views/NodeViews/Base',
        WatchNodeView: 'views/NodeViews/Watch',
        NumNodeView: 'views/NodeViews/Num',
        FormulaView: 'views/NodeViews/Formula',
        InputView: 'views/NodeViews/Input',
        OutputView: 'views/NodeViews/Output',
        CustomNodeView: 'views/NodeViews/CustomNode',
        ThreeCSGNodeView: 'views/NodeViews/ThreeCSG',

        OrbitControls: 'lib/OrbitControls',
        Viewport: 'lib/Viewport',
        FLOODCSG: 'lib/flood/flood_csg',
        FLOOD: 'lib/flood/flood',
        CSG: 'lib/flood/csg',
        scheme: 'lib/flood/scheme',

        // bower
        Hammer: '../bower_components/hammerjs/hammer',
        almond: '../bower_components/almond/almond',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        List: '../bower_components/listjs/dist/list.min',
        Three: '../bower_components/threejs/build/three.min',
        jqueryuitouchpunch: '../bower_components/jqueryui-touch-punch/jquery.ui.touch-punch',
        jqueryuislider: '../bower_components/jquery.ui/ui/jquery.ui.slider',
        jqueryuidraggable: '../bower_components/jquery.ui/ui/jquery.ui.draggable',
        jqueryuicore: '../bower_components/jquery.ui/ui/jquery.ui.core',
        jqueryuimouse: '../bower_components/jquery.ui/ui/jquery.ui.mouse',
        jqueryuiwidget: '../bower_components/jquery.ui/ui/jquery.ui.widget',
        jquery: '../bower_components/jquery/jquery.min',
        backbone: '../bower_components/backbone-amd/backbone-min',
        underscore: '../bower_components/underscore-amd/underscore-min',
        fastclick: '../bower_components/fastclick/lib/fastclick',
        FileSaver: '../bower_components/FileSaver/FileSaver'
    }

});



