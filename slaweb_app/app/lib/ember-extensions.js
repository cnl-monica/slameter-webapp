import Ember from 'ember';

// reconfigure some stuff


// use is-active as active class for link-view
Ember.LinkView.reopen({
    activeClass: 'is-active',
    loadingClass: 'is-loading'
});

// support for error tooltips on text form fields
Ember.TextField.reopen({
    error: null,
    errorTooltipTheme: '.input-error-theme',

    _showError: function() {
        this._initializeTooltipster();

        if (this.get('error')) {
            this.$().tooltipster('content', this.get('error')).tooltipster('show');
            this.$().addClass('has-error');
        } else {
            this.$().tooltipster('content', null).tooltipster('hide');
            this.$().removeClass('has-error');
        }
    }.observes('error'),

    _initializeTooltipster: function() {
        this.$().tooltipster({
            theme: this.get('errorTooltipTheme'),
            position: 'right',
            content: this.get('error')
        });
    }.on('didInsertElement'),

    _destroyTooltipster: function() {
        try {
            this.$().tooltipster('destroy');
        } catch (e) {
            // pass error
        }
    }.on('willDestroyElement'),

    resetError: function(){
        this.set('error', null);
    }.on('change')
});

Ember.View.reopen({
    _initializeAutoTooltipsters: function() {
        $('.tooltip').each(function() {
            var position = $(this).attr('data-tooltip-position') || 'top';

            $(this).tooltipster({
                position: position,
                multiple: true
            });
        });
    }.on('didInsertElement'),

    _destroyAutoTooltipsters: function() {
        try {
            $('.tooltip').tooltipster('destroy');
        } catch (e) {
            // ignore exception that will be thrown when this is called on non-tooltipstered element
        }
    }.on('willDestroyElement')
});


// https://gist.github.com/machty/8413411
// Extend Ember.Route to add support for sensible
// document.title integration.
Ember.Route.reopen({

    // `titleToken` can either be a static string or a function
    // that accepts a model object and returns a string (or array
    // of strings if there are multiple tokens).
    titleToken: null,

    // `title` can either be a static string or a function
    // that accepts an array of tokens and returns a string
    // that will be the document title. The `collectTitleTokens` action
    // stops bubbling once a route is encountered that has a `title`
    // defined.
    title: null,

    // Provided by Ember
    _actions: {
        collectTitleTokens: function (tokens) {
            var titleToken = this.titleToken;
            if (typeof this.titleToken === 'function') {
                titleToken = this.titleToken(this.currentModel);
            }

            if (Ember.isArray(titleToken)) {
                tokens.unshift.apply(this, titleToken);
            } else if (titleToken) {
                tokens.unshift(titleToken);
            }

            // If `title` exists, it signals the end of the
            // token-collection, and the title is decided right here.
            if (this.title) {
                var finalTitle;
                if (typeof this.title === 'function') {
                    finalTitle = this.title(tokens);
                } else {
                    // Tokens aren't even considered... a string
                    // title just sledgehammer overwrites any children tokens.
                    finalTitle = this.title;
                }

                // Stubbable fn that sets document.title
                this.router.setTitle(finalTitle);
            } else {
                // Continue bubbling.
                return true;
            }
        }
    }
});
Ember.Router.reopen({
    updateTitle: function () {
        this.send('collectTitleTokens', []);
    }.on('didTransition'),

    setTitle: function (title) {
        if (Ember.testing) {
            this._title = title;
        } else {
            window.document.title = title;
        }
    }
});



// Promise errors
Ember.RSVP.configure('onerror', function(e) {
    window.console.log(e.message);
    window.console.log(e.stack);
});

