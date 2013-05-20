define(['backbone'], function(Backbone) {

  return Backbone.Model.extend({

    defaults: {
      name: 'Bla'
    }, 
    
    initialize: function(a, b) {
      this.app = a.app;
    }

  });

});


