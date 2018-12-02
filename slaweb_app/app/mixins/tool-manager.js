import Ember from 'ember';

var ToolManagerMixin = Ember.Mixin.create({
    isAnyToolOpened: Ember.computed.notEmpty('openedToolName').readOnly(),
    openedToolName: null,

    actions: {
        toggleTool: function(name, isActive) {
            if (this.get('openedToolName') === name) {
                this.set('openedToolName', null);
            } else if (isActive) {
                this.set('openedToolName', name);
            }
        },
        closeTools: function() {
            this.set('openedToolName', null);
        }

    }

});

export default ToolManagerMixin;
