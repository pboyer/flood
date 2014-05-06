define(['backbone', 'jqueryuidraggable'], function(Backbone, jqueryuidraggable) {

  return Backbone.View.extend({

    tagName: 'div',
    className: 'node',

    template: _.template( $('#node-template').html() ),

    portHeight: 29, 

    events: {
      'mousedown .node-port-output': 'beginPortConnection',
      'mouseup .node-port-input': 'endPortConnection',
      'mousedown .node-port-input': 'beginPortDisconnection',
      'click':  'selectThis',
      'click .use-default-checkbox': 'useDefaultClick',
      'click .toggle-vis': 'toggleGeomVis',
      'click .rep-type': 'replicationClick'
    },

    initialize: function(args) {

      this.workspace = args.workspace;

      this.listenTo(this.model, 'change:position', this.move );
      this.listenTo(this.model, 'connection', this.colorPorts);
      this.listenTo(this.model, 'disconnection', this.colorPorts);
      this.listenTo(this.model, 'change:selected', this.colorSelected);
      this.listenTo(this.model, 'change:visible', this.render);

      this.makeDraggable();
      this.$workspace_canvas = $('#workspace_canvas');
      this.position = this.model.get('position');

    },

    useDefaultClick : function(e){

      var index = parseInt( $(e.currentTarget).attr('data-index') );

      var ign = this.model.get('ignoreDefaults');
      ign[index] = !$(e.target).is(':checked');

      this.model.set('ignoreDefaults', ign);
      this.model.trigger('updateRunner');

    },

    replicationClick : function(e){
      this.model.set('replication', $(e.target).attr('data-rep-type'));
    },

    // should be part of nodeView subclass
    toggleGeomVis: function(e) {
      this.model.set('visible', !this.model.get('visible') );
      e.stopPropagation()
    },

    makeDraggable: function() {

      var that = this;
      this.initPos = [];
      this.$el.draggable( {
        'drag' : function(e, ui) {
          that.workspace.get('nodes').moveSelected([ui.position.left - that.initPos[0], ui.position.top- that.initPos[1] ], that);
          that.model.set('position', [ui.position.left, ui.position.top]);
        },
        'start' : function(startEvent) {
          if (!startEvent.shiftKey)
            that.workspace.get('nodes').deselectAll();
          that.model.set('selected', true );
          that.workspace.get('nodes').startDragging(that);
          that.initPos = that.model.get('position');
        }
      });  
      this.$el.css('position', 'absolute');

    },

    beginPortDisconnection: function(e){

      var index = parseInt( $(e.currentTarget).attr('data-index') );

      if ( !this.model.isPortConnected(index, false) )
        return;

      var inputConnections = this.model.get('inputConnections')
        , connection = inputConnections[index][0]
        , oppos = connection.getOpposite( this.model );

      this.workspace.startProxyConnection( oppos.node.get('_id'), oppos.portIndex, this.getPortPosition(index, false));
      this.workspace.removeConnection( connection );

      e.stopPropagation();
    },

    endPortConnection: function(e){

      if ( !this.workspace.draggingProxy )
        return;

      var index = parseInt( $(e.currentTarget).attr('data-index') );
      this.workspace.completeProxyConnection(this.model.get('_id'), index );
      e.stopPropagation();

    },

    beginPortConnection: function(e){
      var index = parseInt( $(e.currentTarget).attr('data-index') );
      this.workspace.startProxyConnection(this.model.get('_id'), index, this.getPortPosition(index, true));
      e.stopPropagation();
    },

    select: function() {
      this.model.set('selected', true );
    },

    selectable: true,

    selectThis: function(event) {

      console.log('selectThis');

      if (!this.selectable) return;

      console.log('selectThis continue');

      if ( !this.model.get('selected') ){
        if (!event.shiftKey)
          this.workspace.get('nodes').deselectAll();
        this.model.set('selected', true );
      } else {
        this.workspace.get('nodes').deselectAll();
      }

    },

    render: function() {

      this
      .renderNode()
      .colorSelected()
      .moveNode()
      .renderPorts();

      return this;

    },

    renderNode: function() {

      this.$el.html( this.template( this.model.toJSON() ) );
      return this;

    },

    colorSelected: function() {

      if ( this.model.get('selected') ){
        this.$el.addClass('node-selected');
        $(document).bind('keydown', $.proxy( this.handleKeyDownWhenSelected, this) );
      } else {
        this.$el.removeClass('node-selected');
        $(document).unbind('keydown', this.handleKeyDownWhenSelected);
      }

      return this;

    },

    handleKeyDownWhenSelected: function(e) {
      e.preventDefault();

      if (e.keyCode === 8)
        this.workspace.get('nodes').remove(this.model);

    },

    svgTransform: function() {
      return 'translate(' + this.position[0] + ' ' + this.position[1] +')';
    },

    // Get the position of a particular port.  Only valid after render()
    // has been called
    getPortPosition: function( index, isOutputPort ) {
      
      var x = this.position[0]
        , y = this.position[1];

      if (isOutputPort) {
        x += parseInt( this.outputPorts[index].getAttribute('cx')) + 5;
        y += parseInt( this.outputPorts[index].getAttribute('cy'));        
      } else {
        x += parseInt( this.inputPorts[index].getAttribute('cx'))- 5;
        y += parseInt( this.inputPorts[index].getAttribute('cy'));   
      }

      return [x, y];

    },

    colorPorts: function() {

      // update port colors
      var that = this;
      this.inputPorts.forEach(function(ele, ind){

        if (that.model.isPortConnected(ind, false)){
          ele.setAttribute('fill','black');
        } else {
          ele.setAttribute('fill','white');
        }
          
      });

      this.outputPorts.forEach(function(ele, ind){
        if (that.model.isPortConnected(ind, true)){
          ele.setAttribute('fill','black');
        } else {
          ele.setAttribute('fill','white');
        }
          
      });

      return this;

    },

    move: function() {
      return this.moveNode().movePorts();
    },

    moveNode: function() {
      
      this.position = this.model.get('position');
      this.$el.css("left", this.model.get('position')[0] );
      this.$el.css("top", this.model.get('position')[1] );

      return this;
    },

    movePorts: function(){
      if (this.portGroup) { 
        this.portGroup.setAttribute( 'transform', this.svgTransform() );
      }

      return this;
    },

    renderPorts: function() {

      if (this.portGroup) return this.movePorts().colorPorts();

      // create an svg group to hold the port circles
      this.portGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
      this.portGroup.setAttribute( 'transform', this.svgTransform() );

      // create data structures to store the input ports
      this.inputPorts = [];
      this.outputPorts = [];

      // draw the circles
      var that = this;
      var inIndex = 0;
      var outIndex = 0;
      this.$el.find('.node-port').each(function(index, ele) {

        var nodeCircle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        
        // assign default appearance
        nodeCircle.setAttribute('r',5);
        nodeCircle.setAttribute('stroke','black');
        nodeCircle.setAttribute('fill','white');
        nodeCircle.setAttribute('stroke-width','3');

        // position input ports on left side, output ports on right side
        if ( $(ele).hasClass('node-port-input') ) {
          nodeCircle.setAttribute('cx', 0);
          nodeCircle.setAttribute('cy', that.portHeight / 2 + $(ele).position().top); 
          that.inputPorts.push(nodeCircle);
          inIndex++;
        } else {
          nodeCircle.setAttribute('cx', that.$el.width() );
          nodeCircle.setAttribute('cy', that.portHeight / 2 + $(ele).position().top); 
          that.outputPorts.push(nodeCircle);
          outIndex++;
        }
        
        // append 
        that.portGroup.appendChild(nodeCircle);

      });

      return this;

    },

    remove: function() {
      this.$el.remove();
      $(document).unbind('keydown', this.handleKeyDownWhenSelected);
      if (this.portGroup.parentNode)
        this.portGroup.parentNode.removeChild(this.portGroup);
    }

  });

});