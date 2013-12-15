define(['backbone'], function(Backbone) {

  return Backbone.Model.extend({

    defaults: {
      name: null
    }, 
    
    initialize: function(a, b) {
      this.app = a.app;
    }

  });

});


