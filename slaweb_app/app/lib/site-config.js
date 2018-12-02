import Ember from 'ember';

/**
 * Site configuration object, loaded on from `afterModel`
 * hook in application route.
 */
var siteConfig = Ember.ObjectProxy.create({
    model: {}
});

export default siteConfig;
