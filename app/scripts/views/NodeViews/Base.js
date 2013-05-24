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
      'click .toggle-vis': 'toggleGeomVis'
    },

    initialize: function(args) {

      this.workspace = args.workspace;
      this.listenTo(this.model, 'change', this.render);
      this.makeDraggable();
      this.$workspace_canvas = $('#workspace_canvas');
      this.position = this.model.get('position');

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

      console.log('begin port disconnection')

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

      console.log( this.workspace.draggingProxy )
      console.log('end port disconnection')
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

    selectThis: function(event) {

      if ( !this.model.get('selected') ){
        if (!event.shiftKey)
          this.workspace.get('nodes').deselectAll();
        this.model.set('selected', true );
      } else {
        this.workspace.get('nodes').deselectAll();
      }

    },

    render: function() {

      if ( this.model.get('selected') ){
        this.$el.addClass('node-selected');
        $(document).bind('keydown', $.proxy( this.handleKeyDownWhenSelected, this) );
      } else {
        this.$el.removeClass('node-selected');
        $(document).unbind('keydown', this.handleKeyDownWhenSelected);
      }

      this.$el.html( this.template( this.model.toJSON() ) );
      this.move();
      this.updatePorts();

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

    updatePorts: function() {

      // if the port group is already constructed, simply transform it
      if (this.portGroup != undefined) { 

        // update positions
        this.portGroup.setAttribute( 'transform', this.svgTransform() );

      } else {// if ports haven't already been constructed, do it now

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
      } 

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
    },

    move: function() {
      this.position = this.model.get('position');
      this.$el.css("left", this.model.get('position')[0] );
      this.$el.css("top", this.model.get('position')[1] );
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