define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    el: '#login',

    template: _.template( $('#login-template').html() ),

    events: { 'submit #login-form' : 'login',
              'submit #signup-form' : 'signup',
              'click #logout' : 'logout',
              "click .exit-login": 'hide', 
              'click #signup-tab-button': 'focusSignup',
              'click #login-tab-button': 'focusLogin'},

    initialize: function( args, atts ) {

      this.app = atts.app;
      this.model.on('change:showing', this.render, this);
      this.model.on('change:isLoggedIn', this.render, this);

      var that = this;
      $('#login-button').click(function(){ that.tabClick.apply(that); });
    },

    rendered : false,

    render: function() {

      if ( !this.rendered ) {
        this.$el.html( this.template( this.model.toJSON() ) );
        this.rendered = true;
      }

      if (this.model.get('showing') === true){
        this.$el.show();  
      } else {
        this.$el.hide();
      }

      this.renderLoginState();

      return this;
    },

    focusSignup: function(e){
      

      this.$el.find('#login-tab-button').removeClass('tab-button-hilite');
      this.$el.find('#signup-tab-button').addClass('tab-button-hilite');
      this.$el.find('#login-form').hide();
      this.$el.find('#signup-form').show();

    },

    focusLogin: function(e){

      this.$el.find('#signup-tab-button').removeClass('tab-button-hilite');
      this.$el.find('#login-tab-button').addClass('tab-button-hilite');

      this.$el.find('#signup-form').hide();
      this.$el.find('#login-form').show();
    },

    renderLoginState: function(){

      if( this.model.get('isLoggedIn') ){
        $('#login-button').html("Logout");
        this.model.hide();
      } else {
        $('#login-button').html("Login");
        this.$el.show();
      }

      return this;
    },

    tabClick: function(){

      if (this.model.get('isLoggedIn')){
        this.model.logout();
      } else {
        this.model.toggle();
      }

    },

    // Signup state

    signup: function(e) {  
      e.preventDefault();
      this.model.signup( this.$('#signup-form').serialize());
    },

    login: function(e) {  
      e.preventDefault();
      this.model.login( this.$('#login-form').serialize() );
    }

  });
});