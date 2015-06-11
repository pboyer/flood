define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    tagName: 'div',
    className: 'widget',

    template: _.template( $('#widget-template').html() ),

    initialize: function(args) {

      this.model.on('evalFailed', this.onEvalFailed, this );
      this.model.on('evalBegin', this.onEvalBegin, this );

      this.listenTo(this.model, 'requestRender', this.render );
      this.listenTo(this.model, 'change:position', this.move );
      this.listenTo(this.model, 'change:lastValue', this.renderLastValue );
      this.listenTo(this.model, 'change:failureMessage', this.renderLastValue );
      this.listenTo(this.model, 'change:ignoreDefaults', this.colorPorts );
      this.listenTo(this.model, 'change:selected', this.colorSelected);
      this.listenTo(this.model, 'change:visible', this.render);
      this.listenTo(this.model, 'change:isEvaluating', this.colorEvaluating);

      this.model.on('evalFailed', this.onEvalFailed, this );
      this.model.on('evalBegin', this.onEvalBegin, this );

    },

    colorSelected: function(){

    },

    render: function() {

      this.$el.html( this.template( this.model.toJSON() ) );
      return this;

    }

  });

});
