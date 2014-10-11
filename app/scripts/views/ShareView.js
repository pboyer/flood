define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    el: '#share',

    events: { 
      'click #exit-share' : 'clickExit', 
      'click' : 'clickExit',
      'click .modal-box': 'stopPropagation',
      'change .is-customizer-checkbox': 'checkboxChanged'
    },

    template: _.template( $('#share-template').html() ),

    initialize: function( args, atts ) {
      this.app = atts.app;

      this.model.on('success', this.success, this );
    },

    stopPropagation: function(e){
      e.stopPropagation();
    },

    render: function() {

      var ws = this.app.getCurrentWorkspace();

      this.$el.html( this.template({
        name: ws.get('name'),
        isCustomizer: ws.get('isCustomizer'),
        url: ws.getCustomizerUrl()
      }) );

      if (!ws.isCustomizer){
        // we defer this as the input isn't necessarily yet in the dom
        _.defer(function(){ this.$el.find('.url').focus().select(); }.bind(this) );
      }

      return this;

    },

    checkboxChanged: function(){

      var ws = this.app.getCurrentWorkspace();
      ws.set('isCustomizer', this.$el.find('.is-customizer-checkbox').is(':checked') );

    },

    clickExit: function(e){
      this.app.set("showingShare", false);
    }

  });
});