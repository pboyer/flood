define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    el: '#login',

    template: _.template( $('#login-template').html() ),

    events: { 'submit #login-form' : 'login',
              'click #logout' : 'logout',
              "click .exit-login": 'hide' },

    initialize: function( args, atts ) {
      this.app = atts.app;
    },

    render: function() {
      this.$el.html( this.template( this.model.toJSON() ) );
      return this;
    },

    hide: function() {
      this.app.set('showingLogin', false);
    },

    login: function(e) {  
      e.preventDefault();
      this.model.login( this.$('#login-form').serialize() );
    },

    logout: function(e) { 
      e.preventDefault();
      this.model.logout();
    }

  });
});