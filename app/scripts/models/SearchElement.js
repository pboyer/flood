define(['backbone'], function(Backbone) {

  return Backbone.Model.extend({

    defaults: {
      name: null,
      isCustomNode: false,
      functionId: -1
    }, 
    
    initialize: function(a, b) {
      this.app = a.app;
    }

  });

});


