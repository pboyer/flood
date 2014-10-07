define(['backbone', 'BaseWidgetView', 'GeometryWidgetView', 'NumberWidgetView'], 
  function(Backbone, BaseWidgetView, GeometryWidgetView, NumberWidgetView) {

  return Backbone.View.extend({

    el: '#customizer-workspace',

    events: {  },

    initialize: function( args, atts ) {

    },

    map: {
      "Number" : NumberWidgetView
    },

    buildWidget: function(x){

      var widgetView = GeometryWidgetView;

      if (x.get('type').typeName in this.map){
        widgetView = this.map[x.get('type').typeName];
      }

      var widget = new widgetView({model: x});

      if (x.get('type').typeName in this.map){
        this.$el.append( widget.render().$el );
      }

    },

    render: function() {

      this.model.get('nodes').each(this.buildWidget.bind(this));

      return this;

    }

  });
});