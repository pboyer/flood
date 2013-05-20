define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    tagName: 'div',
    className: 'workspace-tab',

    initialize: function(atts) { 

      this.app = this.model.app;
      this.listenTo( this.model, 'change', this.render);

    },

    template: _.template( $('#workspace-tab-template').html() ),

    events: {
      'click':  'click',
      'click .remove-button': 'remove'
    },

    render: function() {

      this.$el.html( this.template( this.model.toJSON() ) );

      if (this.model.get('current') === true){
        this.$el.addClass('current-workspace')
      } else {
        this.$el.removeClass('current-workspace')
      }

    },

    click: function(e) {

      this.model.app.set('currentWorkspace', this.model.get('_id'));

    },

    remove: function(e){

      this.model.app.get('workspaces').remove(this.model);
      e.stopPropagation();

    }

  });

});