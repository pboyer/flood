define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    el: '#share',

    events: { 
      'click #exit-share' : 'clickExit', 
      'click' : 'clickExit',
      'click .modal-box': 'stopPropagation',
      'click .is-customizer-checkbox': 'checkboxChanged'
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
        _.defer(function(){ this.$el.find('.customizer-url').focus().select(); }.bind(this) );
      }

      this.updatePublicPrivate();

      return this;

    },

    updatePublicPrivate: function(){

      if ( this.app.getCurrentWorkspace().get('isCustomizer') ){
        this.$el.find('.is-customizer-checkbox').removeClass("fa-toggle-off");
        this.$el.find('.is-customizer-checkbox').addClass("fa-toggle-on");
        this.$el.find('.public').show();
        this.$el.find('.private').hide();
      } else {
        this.$el.find('.is-customizer-checkbox').removeClass("fa-toggle-on");
        this.$el.find('.is-customizer-checkbox').addClass("fa-toggle-off");
        this.$el.find('.public').hide();
        this.$el.find('.private').show();
      }

    },

    checkboxChanged: function(){

      var ws = this.app.getCurrentWorkspace();
      ws.set('isCustomizer', !ws.get('isCustomizer') );

      this.updatePublicPrivate();

    },

    clickExit: function(e){
      this.app.set("showingShare", false);
    }

  });
});