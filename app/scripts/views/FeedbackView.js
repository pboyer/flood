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
      this.severity = this.$el.find('#feedback-severity');
      this.failureView = this.$el.find('#feedback-failure-message');

      return this;

    },

    fail: function(){

      if (!this.failureView) return;

      if (!this.model.get('failure')) {
        this.failureView.hide();
        return;
      }

      this.failureView.html( this.model.get('failureMessage') );
      this.failureView.show();

    },

    success: function(){
      this.app.set("showingFeedback", false);
    },

    clickExit: function(e){
      this.app.set("showingFeedback", false);
    },

    clickSend: function(e) {
      
      e.preventDefault();
      this.model.send({ subject: this.subject.val(), message: this.message.val() });

    }

  });
});