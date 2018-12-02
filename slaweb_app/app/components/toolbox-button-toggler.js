import Ember from 'ember';

import ToolboxButtonComponent from 'slameter/components/toolbox-button';

var ToolTogglerButtonComponent = ToolboxButtonComponent.extend({
    classNames: ['toolbox-button-toggler'],
    classNameBindings: ['isActive'],

    isActive: false,

    /**
     * Toggle state and send action on button click
     */
    click: function() {
        var self = this;
        this.toggleProperty('isActive');
        Ember.run.next(function(){
            self.sendAction('action', self.get('toolName'), self.get('isActive'));
        });
    }
});

export default ToolTogglerButtonComponent;
