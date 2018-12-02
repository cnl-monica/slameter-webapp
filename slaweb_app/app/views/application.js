import Ember from 'ember';

var ApplicationView = Ember.View.extend({
    classNames: ['app-root'],
    classNameBindings: ['controller.hasLeftSidebar:', 'controller.hasRightSidebar']
});

export default ApplicationView;
