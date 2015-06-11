define(['backbone', 'BaseWidgetView', 'GeometryWidgetView', 'NumberWidgetView'], 
  function(Backbone, BaseWidgetView, GeometryWidgetView, NumberWidgetView) {

  return Backbone.View.extend({

    el: '#customizer-workspace',

    events: { 
      "click #hide-workspace" : "hideWorkspace"
     },

    initialize: function( args, atts ) {

    },

    map: {
      "Number" : NumberWidgetView
    },

    hasWidgets: false,

    buildWidget: function(x){

      if (x.get('extra') != undefined && x.get('extra').lock) return;

      var widgetView = GeometryWidgetView;

      if (x.get('type').typeName in this.map){
        widgetView = this.map[x.get('type').typeName];
      }

      var widget = new widgetView({model: x});

      if (x.get('type').typeName in this.map){
        this.$el.append( widget.render().$el );
        this.hasWidgets = true;
      }

    },

    visible: true,

    hideWorkspace: function(){

      if (this.visible){
        this.$el.addClass('workspace-contracted');
        this.$el.find('.widget').css('visibility', 'hidden');
        this.$el.find('#hide-workspace i').removeClass('fa-arrow-circle-left');
        this.$el.find('#hide-workspace i').addClass('fa-arrow-circle-right');
        this.visible = false;
      } else {
        this.$el.removeClass('workspace-contracted');
        this.$el.find('.widget').css('visibility', 'visible');
        this.$el.find('#hide-workspace i').removeClass('fa-arrow-circle-right');
        this.$el.find('#hide-workspace i').addClass('fa-arrow-circle-left');
        this.visible = true;
      }

    },

    render: function() {

      this.model.get('nodes').each(this.buildWidget.bind(this));

      if (!this.hasWidgets) this.$el.hide();

      return this;

    }

  });
});