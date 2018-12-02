import Ember from 'ember';

import ModalController from '../modal';
import {apiCall} from 'slameter/lib/api-connector';

var UserAccountModalController = ModalController.extend({

    actions: {
        ok: function() {
            var currentPassword = this.get('currentPassword'),
                newPassword = this.get('newPassword'),
                checkPassword = this.get('checkPassword'),
                self = this;

            if (newPassword !== checkPassword) {
                this.set('passwordsDoesNotMatch', 'Passwords does not match');
                return;
            }

            if (newPassword === undefined || checkPassword === undefined || currentPassword === undefined) {
                self.send('showMessage', 'Fill out all fields', 'warning');
                return;
            }

            apiCall(this.get('model.url') + 'set_password/', {
                new_password: this.get('newPassword'),
                old_password: this.get('currentPassword')
            }).then(function() {
                self.send('showMessage', 'Password successfully changed', 'info');
                Ember.run.next(function(){
                    self.send('cancel');
                });
            }, function(reason) {
                if (reason.type === 'FORBIDDEN') {
                    self.set('invalidPassword', 'Invalid password');
                }
            });
        },

        cancel: function() {
            this.setProperties({
                currentPassword: null,
                newPassword: null,
                checkPassword: null
            });
            this._super();
        }
    }

});

export default UserAccountModalController;
