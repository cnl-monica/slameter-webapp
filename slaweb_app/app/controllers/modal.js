import Ember from 'ember';

/**
 * Controller for modal dialog.
 */
var ModalController = Ember.ObjectController.extend({
    actions: {
        /**
         * Close modal dialog.
         * Action 'closeModal` should be implemented on subclass.
         */
        cancel: function() {
            this.send('closeModal');
        }
    }
});

export default ModalController;
