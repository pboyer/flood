define(['backbone', 'Workspace', 'ConnectionView', 'NodeViewTypes'], function(Backbone, Workspace, ConnectionView, NodeViewTypes){

  return Backbone.View.extend({

    tagName: 'div',
    className: 'workspace_container row',

    initialize: function(atts) { 

      this.nodeViews = {};
      this.connectionViews = {};

      this.app = this.model.app;

      this.$workspace = $('<div/>', {class: 'workspace'});

      this.$workspace_back = $('<div/>', {class: 'workspace_back'});
      this.$workspace_canvas = $('<svg class="workspace_canvas" xmlns="http://www.w3.org/2000/svg" version="1.1" />');

      this.$el.append( this.$workspace );
      this.$workspace.append( this.$workspace_back );
      this.$workspace.append( this.$workspace_canvas );

      var that = this;

      this.listenTo(this.model, 'change:connections', function() {
        that.cleanup().renderConnections();
      });

      this.model.on('change:zoom', this.updateZoom, this );

      this.model.on('change:isRunning', this.renderRunnerStatus, this);

      this.listenTo(this.model, 'change:nodes', function() {
        that.cleanup().renderNodes();
      });

      this.listenTo(this.model, 'change:current', this.onChangeCurrent );

      this.listenTo(this.model, 'startProxyDrag', this.startProxyDrag);
      this.listenTo(this.model, 'endProxyDrag', this.endProxyDrag);

      this.renderProxyConnection();

      this.renderRunnerStatus();
      
    },

    events: {
      'click .workspace_back':  'deselectAll',
      'dblclick .workspace_back':  'showNodeSearch'
    },

    render: function() {

      return this
              .cleanup()
              .renderNodes()
              .renderConnections()
              .renderNodes()
              .renderRunnerStatus()
              .updateZoom();

    },

    updateZoom: function(){

      this.$workspace.css('transform', 'scale(' + this.model.get('zoom') + ')' );
      this.$workspace.css('transform-origin', '0 0');

      return this;

    },

    $runnerStatus : undefined,
    runnerTemplate : _.template( $('#workspace-runner-status-template').html() ),
    renderRunnerStatus: function(){

      // placeholder for future work
      return this;

    },

    showNodeSearch: function(e){
      this.app.set('showingSearch', true);
      this.app.newNodePosition = [e.offsetX, e.offsetY];
    },

    startProxyDrag: function(event){
      this.$workspace.bind('mousemove', $.proxy( this.proxyDrag, this) );
      this.$workspace.bind('mouseup', $.proxy( this.endProxyDrag, this) );
    },

    endProxyDrag: function(event){
      this.$workspace.unbind('mousemove', this.proxyDrag);
      this.$workspace.unbind('mouseup', this.endProxyDrag);
      this.model.endProxyConnection();
    },

    proxyDrag: function(event){
      var offset = this.$workspace.offset()
        , zoom = this.model.get('zoom')
        , posInWorkspace = [ (1 / zoom) * (event.pageX - offset.left), (1 / zoom) * ( event.pageY - offset.top) ];

      this.model.proxyConnection.set('endProxyPosition', posInWorkspace);
    },

    renderProxyConnection: function() {

      var view = new ConnectionView({ 
        model: this.model.proxyConnection, 
        workspaceView: this, 
        workspace: this.model, 
        isProxy: true
      });

      view.render();
      this.$workspace_canvas.prepend( view.el );

    },

    cleanup: function() {
      this.clearDeadNodes();
      this.clearDeadConnections();
      return this;
    },

    renderNodes: function() {

      var this_ = this;

      this.model.get('nodes').each(function(nodeModel) {

        var nodeView = this_.nodeViews[nodeModel.get('_id')];

        if ( nodeView === undefined){

          var NodeView = NodeViewTypes.Base;
          if ( NodeViewTypes[ nodeModel.get('typeName') ] != undefined)
          {
            NodeView = NodeViewTypes[ nodeModel.get('typeName') ];
          }
          nodeView = new NodeView({ model: nodeModel, workspaceView: this_, workspace: this_.model });
          this_.nodeViews[ nodeView.model.get('_id') ] = nodeView;

        }

        this_.$workspace.prepend( nodeView.$el );
        nodeView.render();
        nodeView.makeDraggable();
        nodeView.delegateEvents();
        
        this_.$workspace_canvas.append( nodeView.portGroup );

      });

      return this;

    },

    // called by AppView
    keydownHandler: function(e){

      if ( !(e.metaKey || e.ctrlKey) ) return;

      // do not capture from input
      if (e.originalEvent.srcElement.nodeName === "INPUT") return;

      switch (e.keyCode) {
        case 68:
          this.model.removeSelected();
          return e.preventDefault();
        case 67:
          this.model.copy();
          return e.preventDefault();
        case 86:
          this.model.paste();
          return e.preventDefault();
        case 88:
          this.model.copy();
          this.model.removeSelected();
          return e.preventDefault();
        case 89:
          this.model.redo();
          return e.preventDefault();
        case 90:
          this.model.undo();
          return e.preventDefault();
      }

    },

    renderConnections: function() {

      var this_ = this;

      this.model.get('connections').forEach( function( cntn ) {

        var view = this_.connectionViews[cntn.get('_id')]

        if ( this_.connectionViews[cntn.get('_id')] === undefined){
          view = new ConnectionView({ model: cntn, workspaceView: this_, workspace: this_.model });
        }

        view.delegateEvents();

        if (!view.el.parentNode){
          view.render();
          this_.$workspace_canvas.prepend( view.el );

          this_.connectionViews[ view.model.get('_id') ] = view;
        }

      });

      return this;

    },

    clearDeadNodes: function() {

      for (var key in this.nodeViews){
        if (this.model.get('nodes').get(key) === undefined){
          this.nodeViews[key].remove();
          delete this.nodeViews[key];
        }
      }

    },

    clearDeadConnections: function() {
      for (var key in this.connectionViews){
        if (this.model.get('connections').get(key) === undefined){
          this.connectionViews[key].remove();
          delete this.connectionViews[key];
        }
      }
    },

    onRemove: function(){
      this.get('nodes').forEach(function(n){
        if (n.onRemove) n.onRemove();
      })
    },

    deselectAll: function() {
      this.model.get('nodes').deselectAll();
    },

  });
});
