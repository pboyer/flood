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
    packages: [{
        name: "codemirror",
        location: "../bower_components/CodeMirror/",
        main: "lib/codemirror"
    }],
    paths: {

        // backbone collections
        Connections: 'collections/Connections',
        SearchElements: 'collections/SearchElements',
        Nodes: 'collections/Nodes',
        Workspaces: 'collections/Workspaces',
        WorkspaceBrowserElements: 'collections/WorkspaceBrowserElements',

        // backbone models

            // customizer
            CustomizerApp: 'models/customizer/CustomizerApp',

            // editor
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
            Share: 'models/Share',
            Login: 'models/Login',
            GeometryExport: 'models/GeometryExport',
            WorkspaceBrowserElement: 'models/WorkspaceBrowserElement',
            WorkspaceBrowser: 'models/WorkspaceBrowser',
            WorkspaceResolver: 'models/WorkspaceResolver',

        // backbone views

            // customizer
            BaseWidgetView: 'views/customizer/widgets/Base',
            GeometryWidgetView: 'views/customizer/widgets/Geometry',
            NumberWidgetView: 'views/customizer/widgets/Number',

            CustomizerAppView: 'views/customizer/CustomizerAppView',
            CustomizerHeaderView: 'views/customizer/CustomizerHeaderView',
            CustomizerViewerView: 'views/customizer/CustomizerViewerView',
            CustomizerWorkspaceView: 'views/customizer/CustomizerWorkspaceView',

            // editor
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
            ShareView: 'views/ShareView',
            LoginView: 'views/LoginView',
            WorkspaceBrowserElementView: 'views/WorkspaceBrowserElementView',
            WorkspaceBrowserView: 'views/WorkspaceBrowserView',

        // node backbone views
        NodeViewTypes: 'views/nodeviews/NodeViews',
        BaseNodeView: 'views/nodeviews/Base',
        WatchNodeView: 'views/nodeviews/Watch',
        NumNodeView: 'views/nodeviews/Num',
        ScriptView: 'views/nodeviews/Script',
        InputView: 'views/nodeviews/Input',
        OutputView: 'views/nodeviews/Output',
        CustomNodeView: 'views/nodeviews/CustomNode',
        ThreeCSGNodeView: 'views/nodeviews/ThreeCSG',

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



