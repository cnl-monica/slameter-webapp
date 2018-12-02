/* globals ic */

/**
 * Wrapper for ic-ajax library.
 * Makes jQuery ajax to work nicely with Ember.
 * @returns {Promise} - promise of eventually resolver request
 */
function ajax(){
    return ic.ajax.apply(null, arguments);
}

export default ajax;