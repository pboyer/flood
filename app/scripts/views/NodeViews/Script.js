define(['backbone', 'underscore', 'jquery', 'ThreeCSGNodeView', 'FLOOD', 'codemirror', 'codemirror/addon/hint/javascript-hint', 'codemirror/mode/javascript/javascript'], function(Backbone, _, $, ThreeCSGNodeView, FLOOD, CodeMirror) {

  return ThreeCSGNodeView.extend({

    initialize: function(args) {
      ThreeCSGNodeView.prototype.initialize.apply(this, arguments);
      this.listenTo(this.model,'change:extra', this.onChangedExtra);
    },

    innerTemplate : _.template( $('#node-script-template').html() ),

    getCustomContents: function() {

      var js = this.model.toJSON() ;
      if (!js.extra.script) js.extra.script = this.model.get('type').script;

      return this.innerTemplate( js );

    },

    onChangedExtra: function(){

      var ex = this.model.get('extra') || {};

      if (ex.numInputs != undefined ){
        this.setNumInputConnections( ex.numInputs )
        this.model.get('type').setNumInputs( ex.numInputs );
      }

    	this.render();
    	this.model.trigger('updateRunner');
		  this.model.workspace.run();
    },

    setNumInputConnections: function(num){

      if (num === undefined) return;

      var inputConns = this.model.get('inputConnections');

      var diff = num - inputConns.length;

      if (diff === 0) return;

      if (diff > 0){
        for (var i = 0; i < diff; i++){
          inputConns.push([]);
        }
      } else {
        for (var i = 0; i < -diff; i++){

          var conn = this.model.getConnectionAtIndex(inputConns.length - 1);

          if (conn != null){
            this.model.workspace.removeConnection(conn);
          }

          inputConns.pop();
        }

      }

    },

    renderNode: function() {
      ThreeCSGNodeView.prototype.renderNode.apply(this, arguments);

      var ta = this.$el.find('.script-text-input');
      var cm = CodeMirror.fromTextArea(ta[0], { mode: "javascript" });

      var that = this;
      
      cm.on("focus",function(e){
	that.selectable = false;
      	that.model.set('selected', false);
      });

      cm.on("change", function(){
	// we need to update the ports and connectors after moving the node
        setTimeout(function(){ 
		// update the position of the node ports
		that.renderPorts(); 
		// update the position of the connections
		that.model.trigger('resized'); 
	}, 0);
      });

      cm.on("blur",function(){
     	var ex = JSON.parse( JSON.stringify( that.model.get('extra') ) );
      	if ( ex.script === cm.getValue() ) return;

      	ex.script = cm.getValue();

      	that.model.workspace.setNodeProperty({property: "extra", _id: that.model.get('_id'), newValue: ex });
      	that.selectable = true;
      });
      
      this.$el.find('.add-input').click(function(){ that.addInput.call(that); });
      this.$el.find('.remove-input').click(function(){ that.removeInput.call(that); });
      
      return this;
    },

    setNumInputsProperty: function(numInputs){
      if (numInputs === undefined) return;

      var ex = this.model.get('extra');
      var exCopy = JSON.parse( JSON.stringify( ex ) );

      exCopy.numInputs = numInputs;
      this.model.workspace.setNodeProperty({property: "extra", _id: this.model.get('_id'), newValue: exCopy, oldValue: ex });
    },

    addInput: function(){

    	var type = this.model.get('type');
      var ex = this.model.get('extra');
  	  var numInputs = ex.numInputs;

  	  if (numInputs === undefined) numInputs = 0;
  	  if (type.inputs.length === 26) return;

      this.setNumInputsProperty(numInputs + 1);

    },

    removeInput: function(){

    	var type = this.model.get('type');
      var ex = this.model.get('extra');
  	  var numInputs = ex.numInputs;

  	  if (numInputs === undefined) numInputs = 1;
  	  if (type.inputs.length === 0) return;

      this.setNumInputsProperty(numInputs - 1);

    }

  });

});
