define(['backbone'], function(Backbone) {

  return Backbone.View.extend({

    tagName: 'li',
    className: 'workspace-browser-element',

    template: _.template( $('#workspace-browser-element-template').html() ),

    events: {
      'click .workspace-browser-element-open':  'clickOpen',
      'click .delete-workspace':  'clickDelete',
      'mouseenter': 'mouseenter',
      'mouseleave': 'mouseleave'
    },

    initialize: function(_, vals){
      this.app = vals.app;
    },

    render: function() {

      var v = this.model.toJSON();
      var lastSave = this.model.get('lastSaved');

      if (typeof lastSave === "string") {
        v["prettyDate"] = this.prettyDate( new Date(lastSave) );
      } else {
        v["prettyDate"] = "Unknown";
      }
      
      this.$el.html( this.template( v ) );
      this.$open = this.$el.find('.workspace-browser-element-open');

    },

    prettyDate: function(date){

      var diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
          
      if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
        return;
          
      return day_diff == 0 && (
          diff < 60 && "just now" ||
          diff < 120 && "1 minute ago" ||
          diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
          diff < 7200 && "1 hour ago" ||
          diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
        day_diff == 1 && "Yesterday" ||
        day_diff < 7 && day_diff + " days ago" ||
        day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
    },

    mouseenter: function(e){
      this.$open.css('visibility', 'visible');
    },

    mouseleave: function(e){
      this.$open.css('visibility', 'hidden');
    },

    clickOpen: function(e) {

      this.app.openWorkspace( this.model.get('_id') );

    },

    clickDelete: function(e){

    }

  });

});