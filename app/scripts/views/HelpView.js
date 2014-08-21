define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    el: '#help',

    events: { "click .exit-help": 'hide', 
              'click .enter-help-section' : 'clickEnterHelpSection',
              'click .exit-all-help' : 'hide',
              'click .exit-help-section' : 'clickExitHelpSection' 
            },

    initialize: function( args, atts ) {
      this.app = atts.app;
    },

    render: function() {

      var template = _.template( $('#help-section-template').html() );

      var that = this;

      this.$el.html();

      this.model.get('sections').forEach(function(section){

        var el = $('#' + section.targetId );
        
        if (!el) return;

        var offset = el.offset();
        var height = el.height();
        var width = el.width();

        if (section.offset[0] < 0) {
          width = -10;
        }

        if (section.offset[1] < 0) {
          height = -10;
          width -= 10;
        }

        section.elementPosition = [ offset.left + width, offset.top + height ];
        that.$el.append(template( section ));

      });

      this.rendered = true;

      return this;

    },

    getHelpSection: function(e){

      var ui = $(event.target);
      var attr = ui.attr('data-target-id');

      return this.$el.find(".help-section[data-target-id='" + attr + "']");

    },

    clickEnterHelpSection: function(e){

      var ele = this.getHelpSection(e);
      var ui = $(event.target);

      ele.fadeIn();
      ui.fadeOut();

    },

    clickExitHelpSection: function(e){

      var ele = this.getHelpSection(e);
      ele.fadeOut();

    },

    hide: function() {
      this.app.set('showingHelp', false);
    }

  });
});