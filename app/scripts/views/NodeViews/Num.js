define(['backbone', 'underscore', 'jquery', 'BaseNodeView', 'jqueryuislider'], function(Backbone, _, $, BaseNodeView) {

  return BaseNodeView.extend({

    template: _.template( $('#node-num-template').html() ),

    initialize: function(args) {
      BaseNodeView.prototype.initialize.apply(this, arguments);
    },

    render: function() {
      
      BaseNodeView.prototype.render.apply(this, arguments);

      // make the slider
      this.slider = this.$el.find('.slider');

      var min = this.model.get('extra').min != undefined ? this.model.get('extra').min : -150;
      var max = this.model.get('extra').max != undefined ? this.model.get('extra').max : 150;
      var step = this.model.get('extra').step != undefined ? this.model.get('extra').step : 0.1;

      var that = this;
      this.slider.slider(
        { min: min, 
          max: max, 
          step: step, 
          value: this.model.get('lastValue'),
          change: function(e, ui){ that.inputSet.call(that, e, ui); },
          slide: function(e, ui){ that.inputChanged.call(that, e, ui); } 
        });

      this.minInput = this.$el.find('.num-min');
      this.minInput.val(min);
      this.minInput.change( function(e){ that.minChanged.call(that, e); e.stopPropagation(); });

      this.maxInput = this.$el.find('.num-max');
      this.maxInput.val(max);
      this.maxInput.change( function(e){ that.maxChanged.call(that, e); e.stopPropagation(); });

      this.stepInput = this.$el.find('.num-step');
      this.stepInput.val(step);
      this.stepInput.change( function(e){ that.stepChanged.call(that, e); e.stopPropagation(); });

      // adjust settings dropdown so that it stays open while editing
      // doesn't select the node when you're editing
      $('.dropdown.keep-open').on({
        "shown.bs.dropdown": function() {
          that.selectable = false;
          that.model.set('selected', false);
          $(this).data('closable', false);
        },
        "mouseleave": function() {
          $(this).data('closable', true);
        },
        "click": function() {
          $(this).data('closable', false);
        },
        "hide.bs.dropdown": function() {
          if ( $(this).data('closable') ) that.selectable = true;
          return $(this).data('closable');
        }
      });

      return this;

    },

    currentValue: function(){
      return this.slider.slider("option", "value");
    },

    setSliderValue: function(val){
      return this.slider.slider("option", "value", val);
    },

    minChanged: function(e, u){
      var val = parseFloat( this.minInput.val() );
      if (isNaN(val)) return;
      if (this.currentValue < val) this.setSliderValue(val);
      this.slider.slider("option", "min", val);
    },

    maxChanged: function(e){
      var val = parseFloat( this.maxInput.val() );
      if (isNaN(val)) return;
      if (this.currentValue > val) this.setSliderValue(val);
      this.slider.slider("option", "max", val);
    },

    stepChanged: function(e){
      var val = parseFloat( this.stepInput.val() );
      if (isNaN(val)) return;
      this.slider.slider("option", "step", val);
    },

    inputChanged: function(e,ui) {

      var val = ui.value;
      this.$el.find('.currentValue').html(val);

    },

    inputSet: function(e,ui) {

      var val = ui.value;

      this.$el.find('.currentValue').html(val);

      this.model.set('extra', {   min: this.slider.slider("option", "min"), 
                                  step: this.slider.slider("option", "step"), 
                                  max: this.slider.slider("option", "max") });

      this.model.set('lastValue', val );
      this.model.trigger('updateRunner');

      this.model.workspace.run();

    }

  });

});