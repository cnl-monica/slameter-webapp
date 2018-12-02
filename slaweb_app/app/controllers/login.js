import Ember from 'ember';

/**
 * Login controller. Manages actions on login screen.
 */
var LoginController = Ember.Controller.extend({

    actions: {
        /**
         * Action for login button.
         * Tries to log-in user with given credentials.
         */
        authenticate: function() {
            var self = this,
                loginData = this.getProperties('username', 'password');

            //clear form
            this.set('username', null);
            this.set('password', null);

            this.get('session').authenticate(loginData).then(function(){
                self.send('authenticationSucceeded');
            }, function(error) {
                self.send('authenticationFailed', error);
            });
        },

        /**
         * When login succeeded, take user to the originally
         * intended url, if any, or to the apps index page.
         */
        authenticationSucceeded: function() {
            var unfinishedTransition = this.get('unfinishedTransition');

            this.send('closeAllMessages');

            if (unfinishedTransition) {
                unfinishedTransition.retry();
            } else {
                this.transitionToRoute('apps');
            }
        },

        /**
         * When login failed, show user the reason.
         * @param error failure reason send by server.
         */
        authenticationFailed: function(error) {
            var responseText;

            try {
                responseText = JSON.parse(error.jqXHR.responseText);
            } catch (e) {
                this.send('showMessage', 'Login failed', 'error');
                return;
            }

            if (responseText) {
                if (responseText.username) {
                    this.set('emailError', responseText.username[0]);
                }
                if (responseText.password) {
                    this.set('passwordError', responseText.password[0]);
                }
                if (responseText.non_field_errors) {
                    this.send('showMessage', responseText.non_field_errors[0], 'error');
                }
            }
        }
    }
});

export default LoginController;

