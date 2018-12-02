import Ember from 'ember';

var MessengerView = Ember.CollectionView.extend({
    classNames: ['messenger'],
    content: Ember.computed.alias('controller.model'),

    itemViewClass: Ember.View.extend({
        classNames: ['message'],
        classNameBindings: ['messageType'],
        templateName: 'messenger-message',
        messageType: function() {
            return 'message-' + this.get('content.type');
        }.property('content.type'),
        iconClass: function() {
            return 'icon-' + this.get('content.type');
        }.property('content.type'),
        click: function() {
            this.get('controller').send('close', this.get('content.message'));
        },
        scheduleMessageClosing: function() {
            var self = this,
                controller = this.get('controller'),
                timeout = this.get('content.timeout');

            if (this.getWithDefault('parentView.autoClose', true) || timeout) {
                Ember.run.later(function(){
                    controller.send('close', self.get('content.message'));
                }, timeout || 10000);
            }
        }.on('didInsertElement')
    })
});

export default MessengerView;
