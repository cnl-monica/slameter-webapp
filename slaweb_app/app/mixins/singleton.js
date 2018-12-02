import Ember from 'ember';

/**
 * This mixin allows a class to return a singleton.
 *
 * based on: https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/singleton.js
 *
 * Use: with reopenClass, as those methods must be properties of class
 *
 * ```javascript
 * User = Ember.Object.extend({});
 * User.reopenClass(SingletonMixin);
 *
 * var instance = User.current();
 * ```
 */
var SingletonMixin = Ember.Mixin.create({
    /**
     * Returns the current instance of the class.
     *
     * @method current
     * @returns {Ember.Object} - the instance of singleton
     */
    current: function() {
        if (!this._current) {
            this._current = this.createCurrent();
        }
        return this._current;
    },

    /**
     * Override this method to control how the singleton instance is created.
     */
    createCurrent: function() {
        return this.create({});
    },

    /**
     * Method for convenient access to instance properties
     *
     * @param {String} property - property to access
     * @param {String} [value] - optional value in case we want to set property to new value
     * @returns the value of the property
     */
    currentProp: function(property, value) {
        var instance = this.current();
        if (!instance) {
            return;
        }
        if (typeof(value) !== 'undefined') {
            instance.set(property, value);
            return value;
        } else {
            return instance.get(property);
        }
    }
});

export default SingletonMixin;
