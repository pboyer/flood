define(['backbone', 'underscore', 'jquery', 'BaseNodeView'], function(Backbone, _, $, BaseNodeView) {

  return BaseNodeView.extend({

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);

      this.model.on('change:selected', this.selectGeom, this);
      this.model.on('change:visible', this.changeVisibility, this);
      this.model.on('remove', this.onRemove, this);
      this.model.on('change:prettyLastValue', this.onEvalComplete, this );
      this.model.workspace.on('change:current', this.changeVisibility, this);

      this.onEvalComplete();

    },

    selectGeom: function(){

      if ( this.threeGeom && this.model.get('visible') ){
        if (this.model.get('selected')) {
          this.threeGeom.traverse(function(ele) {
            ele.material = new THREE.MeshPhongMaterial({color: 0x00FFFF, specular: 0xFFFFFF, opacity: 0.7, transparent: true});
          });
        } else {
          this.threeGeom.traverse(function(ele) {
            ele.material = new THREE.MeshPhongMaterial({color: 0xDDDDDD, specular: 0xFFFFFF, opacity: 0.7, transparent: true});
          });
        }
      }

    }, 

    // 3D move to node subclass
    onRemove: function(){
      this.model.workspace.off('change:current', this.changeVisibility, this);
      scene.remove(this.threeGeom); 
    }, 

    evaluated: false,

    toThreeMesh: function( mesh ) {

      var three_geometry = new THREE.Geometry( ), face;

      for ( var i = 0; i < mesh.vertices.length; i++ ) {
        var v = mesh.vertices[i];
        three_geometry.vertices.push( new THREE.Vector3( v[0], v[1], v[2] ) );
      }

      for ( var i = 0; i < mesh.faces.length; i++ ) {
        var f = mesh.faces[i];
        face = new THREE.Face3( f[0], f[1], f[2], new THREE.Vector3( f[3][0], f[3][1], f[3][2] ) );
        three_geometry.faces.push( face );
      }
      
      three_geometry.computeBoundingBox();
      
      return three_geometry;
      
    },

    onEvalComplete: function(a, b, newValue){

      if (!newValue && this.evaluated) return;

      this.evaluated = true;

      var lastValue = this.model.get('prettyLastValue');
      var temp;

      if ( !lastValue ) return;

      if ( lastValue.vertices ){ 
        temp = [];
        temp.push(lastValue);
      } else {
        temp = lastValue; // extract the list
      } 

      if ( this.threeGeom ){
        scene.remove(this.threeGeom);
      }

      this.threeGeom = new THREE.Object3D();

      var that = this;

      temp.map(function(ele){

        var g3  = that.toThreeMesh( ele );
        
        if (that.model.get('selected')){
          var color = 0x00FFFF;
        } else {
          var color = 0xDDDDDD;
        }

        var mesh = new THREE.Mesh(g3, new THREE.MeshPhongMaterial({color: color, specular: 0xFFFFFF, opacity: 0.7, transparent: true}));
        that.threeGeom.add( mesh );

      });

      this.changeVisibility();

    }, 

    changeVisibility: function(){

      if ( !this.threeGeom ){
        return
      }
        
      if (!this.model.get('visible') || !this.model.workspace.get('current') )
      {
        scene.remove(this.threeGeom);
      } else if ( this.model.get('visible') )
      {
        scene.add(this.threeGeom);
      }

    },

    render: function() {
      
      BaseNodeView.prototype.render.apply(this, arguments);

      this.$toggleVis = this.$el.find('.toggle-vis');
      this.$toggleVis.show();

      if (this.model.get('visible')){
        this.$toggleVis.find('img').attr('src', 'images/vis_off.png');
        this.$toggleVis.attr('title', 'Hide geometry');
      } else {
        this.$toggleVis.find('img').attr('src', 'images/toggle_vis.png');
        this.$toggleVis.attr('title', 'Show geometry');
      }

      return this;

    },

  });

});