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

      'click': 'click',
      'click .remove-button': 'remove',
      'mouseover': 'showEditButton',
      'mouseout': 'hideEditButton',
      'click .edit-button': 'startEdit',
      'blur .workspace-name': 'endEdit'

    },

    render: function() {

      console.log('yo')

      this.$el.html( this.template( this.model.toJSON() ) );

      if (this.model.get('current') === true){
        this.$el.addClass('current-workspace')
      } else {
        this.$el.removeClass('current-workspace')
      }

    },

    showEditButton: function() {
      this.$('.edit-button').css('visibility', 'visible');
    },

    startEdit: function(e) {
      this.$('.workspace-name').prop('disabled', false);
      this.$('.workspace-name').focus();
      e.stopPropagation();
    },

    endEdit: function() {
      this.$('.workspace-name').prop('disabled', true);
      this.model.set('name', this.$('.workspace-name').val() );
    },

    hideEditButton: function() {
      this.$('.edit-button').css('visibility', 'hidden');
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