import Ember from 'ember';

var ModalDialogComponent = Ember.Component.extend({
    cancelAction: 'cancel',
    okAction: 'ok',

    actions: {
        cancel: function() {
            this.sendAction('cancelAction');
        },
        ok: function() {
            this.sendAction('okAction');
        }
    },

    animateIn: function() {
        var el = this.$('.l-modal-overlay, .l-modal-dialog');

        $('.tooltipstered').tooltipster('hide');
        Ember.run.next(function() {
           el.addClass('is-showing');
        });
    }.on('didInsertElement')
});

export default ModalDialogComponent;
