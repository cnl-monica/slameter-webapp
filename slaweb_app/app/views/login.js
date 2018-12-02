import Ember from 'ember';

var LoginView = Ember.View.extend({

    /**
     * Bit of a hack to force Ember to register field values
     * that may have been inserted by browser's auto-fill
     */
    didInsertElement: function() {
        var self = this;
        Ember.run.later(function(){
            self.$('input').trigger('change');
        }, 50);
    }

});

export default LoginView;
