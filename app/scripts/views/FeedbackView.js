define(['backbone'], function(Backbone) {

  'use strict';

  return Backbone.View.extend({

    el: '#feedback',

    events: { 'click #exit-feedback' : 'clickExit',
              'submit #submit-feedback' : 'clickSend', 
              'click #submit-feedback' : 'clickSend' },

    template: _.template( $('#feedback-template').html() ),

    initialize: function( args, atts ) {
      this.app = atts.app;

      this.model.on('change:failure', this.fail, this );
      this.model.on('success', this.success, this );
    },

    render: function() {

      this.$el.html( this.template( this.model.toJSON() ) );

      this.subject = this.$el.find('#feedback-subject');
      this.message = this.$el.find('#feedback-message');
      this.failureView = this.$el.find('#feedback-failure-message');
      this.successView = this.$el.find('#feedback-success-message');
      this.sendingView = this.$el.find('#feedback-sending-message');

      return this;

    },

    fail: function(){

      this.sendingView.hide();

      if (!this.failureView) return;

      if (!this.model.get('failure')) {
        this.failureView.hide();
        return;
      }

      this.failureView.html( this.model.get('failureMessage') );
      this.failureView.show();

    },

    success: function(){

      this.sendingView.hide();
      this.successView.show();

      var that = this;

      setTimeout(function(){
        that.app.set("showingFeedback", false);

        that.subject.val("");
        that.message.val("");

        that.successView.fadeOut();
      }, 800);

    },

    clickExit: function(e){
      this.app.set("showingFeedback", false);
    },

    clickSend: function(e) {
      
      e.preventDefault();
      this.sendingView.show();
      this.model.send({ subject: this.subject.val(), message: this.message.val() });

    }

  });
});