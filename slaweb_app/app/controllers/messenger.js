import Ember from 'ember';

/**
 * Messenger is used to display various messages in application.
 * It is placed in topbar for global messages and in each module for local messages.
 * See messenger view for more details.
 */
var MessengerController = Ember.ArrayController.extend({

    actions: {
        /**
         * Show message
         * @param message text of the message
         * @param type type of the message to give it icon and coloring
         * @param timeout time after which message should be closed, in ms
         */
        show: function(message, type, timeout) {
            this.pushObject({message: message, type: type || 'info', timeout: timeout});
        },
        /**
         * Close message with given text
         * @param message message text that will be removed
         */
        close: function(message) {
            this.removeObjects(this.filterBy('message', message));
        },

        /**
         * Close all messages
         */
        closeAll: function() {
            this.clear();
        }
    }

});

export default MessengerController;
