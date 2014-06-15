define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    workspaceView : null,

    initialize: function( args ) {

      this.model = args.model;
      this.workspace = args.workspace;
      this.workspaceView = args.workspaceView;

      this.listenTo(this.model, 'change', this.render);

    },

    render: function() {

      this.makeElementOnce();

      return this.updateCorners()
        .updateHidden()
        .updateColor()
        .updateStroke();

    },

    updateCorners: function(){
      this.el.setAttribute('d', this.template( this.getCorners() ))
      return this;
    },

    updateHidden: function(){

      if (this.model.get('hidden')) {
        this.el.setAttribute('class','marquee collapsed');
      } else {
        this.el.setAttribute('class','marquee');
      }

      return this;

    },

    updateColor: function(){
      return this;
    },

    curveInit: false, 

    makeElementOnce: function() {

      if (!this.curveInit) {

        var crv = document.createElementNS('http://www.w3.org/2000/svg','rect');
        crv.setAttribute('class','marquee');

        this.updateCorners();
        this.updateStroke();

        this.el = crv;
        this.$el = $(crv);
        this.curveInit = true;

      }
      return this.el;

    },

    updateCorners: function() {

      this.el.setAttribute('x',this.model.get('x'));
      this.el.setAttribute('y',this.model.get('y'));
      this.el.setAttribute('width',this.model.get('width'));
      this.el.setAttribute('height',this.model.get('height'));

      return this;

    },

    updateStroke: function() {

      // we scale the stroke to avoid the marquee being overly thin or thick
      // when zoomed
      var zoom = 1 / this.workspace.get('zoom');

      this.el.setAttribute('stroke-dasharray', (zoom * 4) + "," + (zoom * 4) );
      this.el.setAttribute('stroke', zoom * 2  );

      return this;
    }

  });

});