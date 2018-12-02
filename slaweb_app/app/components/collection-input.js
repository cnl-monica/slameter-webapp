import Ember from 'ember';

/**
 * Form widget for entering a collection of values
 */
var CollectionInputComponent = Ember.Component.extend({
    classNames: ['collection-input'],

    /**
     * Type of the values in collection
     * Supported are `string` and `number`
     * Used for deserialization
     */
    type: 'string',  //supported: 'string', 'number'

    actions: {
        /**
         * Add a value to collection
         *
         * @param {String} value a value to add
         */
        add: function(value) {
            if (this.get('collection') === undefined) {
                this.set('collection', Ember.A([]));
            }

            if (value) {
                if (this.get('type') === 'number') {
                    value = parseFloat(value);
                    if (isNaN(value)) {
                        this.set('valueError', 'please insert '+this.get('type'));
                        return;
                    }
                }

                this.collection.addObject(value);
                this.set('newItem', '');
            }

            this.get('scrollbarView').$().mCustomScrollbar('update');
            this.get('scrollbarView').$().mCustomScrollbar('scrollTo', 'bottom');
        },

        /**
         * Remove a value from collection
         *
         * @param value a value to remove from collection
         */
        remove: function(value) {
            this.collection.removeObject(value);
        },

        /**
         * Clear whole collection
         */
        clear: function() {
            this.set('collection', Ember.A([]));
        }
    }

});

export default CollectionInputComponent;
