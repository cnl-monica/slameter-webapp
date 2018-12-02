import Ember from 'ember';

import ToolManagerMixin from 'slameter/mixins/tool-manager';
import {merge} from 'slameter/lib/misc';

var BaseSectionController = Ember.ObjectController.extend(Ember.Evented, ToolManagerMixin, {
    sectionName: Ember.computed.alias('model.sectionConfig.name'),

    navigation: {},

    paramGlobalQuery: {},
    lastGlobalQuery: {},
    globalQuery: {},

    _deferredModuleLoadingCount: 0,
    _moduleLoadIsPending: false,

    /**
     * Executes `callback` function on each module, with `context` as `this` keyword.
     * Callback syntax is same as for Ember.EnumerableUtils.forEach method:
     *
     * ```javascript
     * function(item, index, enumerable);
     * ```
     * @param callback function to run for each module
     * @param [target] `this` context for `callback`
     */
    forEachModule: function(callback, target) {
        if (this.get('model.modules')) {
            Ember.EnumerableUtils.forEach(this.get('model.modules'), callback, target);
        }
    },

    sendQueryToModules: function(content, force) {
        this.forEachModule(function(module) {

            var moduleController = module.get('controller'),
                moduleQuery = moduleController.get('inputQuery');

            if (!moduleQuery) {
                moduleController.set('inputQuery', {});
                moduleQuery = moduleController.get('inputQuery');
            }

            if (force || moduleController.get('acceptsGlobalQueries')) {
                moduleController.propertyWillChange('inputQuery');
                merge(moduleQuery, content);
                moduleController.propertyDidChange('inputQuery');
            }
        }, this);
    },

    /**
     * Sends global filter query to each module.
     *
     * @method sendGlobalQueryToModules
     * @public
     */
    sendGlobalQueryToModules: function() {
        // set global filter query to property that is mapping it's content to URL query params
        this.set('paramGlobalQuery', Ember.copy(this.get('globalQuery'), true));

        this.sendQueryToModules(this.get('paramGlobalQuery'));

        // if modules are to be loaded automatically, load them,
        // else save query without module reload
        // TODO this feature needs an user interface, and also localStorage should be wrapped in Ember object/controller
        if (!window.localStorage.noAutoModuleLoad) {
            this.loadModules(true);
        } else {
            this.trigger('applyFilterOnModules');
        }
    }.on('sendQueryToModules'),

    /**
     * Sends query from navigation modules to every module
     *
     * @method sendNavigationToModules
     * @public
     */
    sendNavigationToModules: function() {
        this.sendQueryToModules(this.get('navigation'), true);
    },

    /**
     * Load all modules.
     * Debounces calls to _loadModules
     *
     * @method loadModules
     * @public
     *
     * @param {boolean} [applyFilter] apply current filter, or reload only
     */
    loadModules: function(applyFilter) {
        if (this.get('_deferredModuleLoadingCount') > 0) {
            this.set('_applyFilterWhenModulesCanBeLoaded', applyFilter);
            this.set('_moduleLoadIsPending', true);
            return;
        }
        this.set('_moduleLoadIsPending', false);
        Ember.run.debounce(this, this._loadModules, applyFilter, 250);
    }.on('loadModules'),

    /**
     * Performs actual module load
     *
     * @method _loadModules
     * @param {boolean} [applyFilter] apply current filter, or reload only
     * @private
     */
    _loadModules: function(applyFilter) {
        this.forEachModule(function(module){
            if (typeof module.controller.applyFilter === 'function') {
                module.controller.trigger(applyFilter? 'applyFilter' : 'reload');
            }
        });
    },

    /**
     * Debounces call to _applyFilterOnModules
     *
     * @method applyFilterOnModules
     * @public
     */
    applyFilterOnModules: function() {
        Ember.run.debounce(this, this._applyFilterOnModules, 250);
    }.on('applyFilterOnModules'),

    /**
     * Saves currently set filter on each module
     *
     * @method _applyFilterOnModules
     * @private
     */
    _applyFilterOnModules: function() {
        this.forEachModule(function(module) {
            if (typeof module.controller.saveQuery === 'function') {
                module.controller.saveQuery();
            }
        });
    },

    /**
     * Deactivate event is send on route `willTransition` action.
     * This is chance for modules to finish their jobs, e.g. stop
     * real-time communication with server.
     */
    deactivateModules: function() {
        this.forEachModule(function(module){
            module.controller.trigger('deactivate');
        }, this);
    }.on('routeWillTransition'),

    /**
     * When modules can be loaded (deferred count became zero),
     * check for existing pending loads, and if any exists,
     * execute module load.
     *
     * @method _executePendingModuleLoads
     * @private
     */
    _executePendingModuleLoad: function() {
        if (this.get('_moduleLoadIsPending') && this.get('_deferredModuleLoadingCount') <= 0) {
            this.loadModules(this.get('_applyFilterWhenModulesCanBeLoaded'));
        }
    }.observes('_moduleLoadIsPending', '_deferredModuleLoadingCount'),

    /**
     * Restore global filter query to it's last state loaded from server
     *
     * @method restoreQuery
     * @public
     */
    restoreQuery: function() {
        this.set('lastGlobalQuery', Ember.copy(this.get('lastGlobalQuery'), true));
    },

    actions: {
        applyGlobalQuery: function() {
            this.trigger('sendQueryToModules');
        },

        restoreGlobalQuery: function() {
            this.restoreQuery();
        },

        /**
         * Postpone module loadings by incrementing _deferredModuleLoadingCount variable,
         * which must be zero in order to load modules.
         * This can be used to postpone module loading to the unspecified time in the future,
         * when additional setup is required in other place of the application before modules
         * can be loaded. When required setup (action) is finished, you must send `advanceModuleLoading`
         * action to this controller to decrement _deferredModuleLoadingCount.
         *
         * Example of usage:
         * ```javascript
         * # some module controller
         * needs: ['$app.$section'],
         * init: function() {
         *  var self = this;
         *  this.controllers.get('$app.$section$).send('deferModuleLoading');
         *
         *  # do some (asynchronous) stuff...
         *  promise.then(function(){
         *   self.controllers.get('$app.$section').send('advanceModuleLading');
         *   # if module loading was requested before this call, and this call causes
         *   # `_deferredModuleLoadingCount` to become zero, modules will be loaded
         *  });
         * },
         * ```
         *
         * For relationship of this action to module loads, see `loadModules` method.
         *
         * @method deferModuleLoading
         * @public
         */
        deferModuleLoading: function() {
            var moduleLoadingDeferCount = this.get('_deferredModuleLoadingCount');

            if (moduleLoadingDeferCount < 0) {
                this.set('_deferredModuleLoadingCount', 1);
            } else {
                this.incrementProperty('_deferredModuleLoadingCount');
            }

        },

        /**
         * Decrement _deferredModuleLoadingCount variable in order to signalize that action
         * announced before with call to `deferModuleLoading` was finished and modules are able to load.
         *
         * @method advanceModuleLoading
         * @public
         */
        advanceModuleLoading: function() {
            var moduleLoadingDeferCount = this.get('_deferredModuleLoadingCount');

            if (moduleLoadingDeferCount <= 0) {
                this.set('_deferredModuleLoadingCount', 0);
            } else {
                this.decrementProperty('_deferredModuleLoadingCount');
            }
        },

        /**
         * Cancel any module loads that were requested during deferred phase and were not yet executed.
         *
         * @method dismissPendingLoads
         * @public
         */
        dismissPendingLoads: function() {
            this.setProperties({
                _moduleLoadIsPending: false,
                _deferredModuleLoadingCount: 0
            });
        }
    },


    /**
     * Name of the template for section tools.
     *
     * @property toolsTemplate
     */
    toolsTemplate: function() {
        return this.computePartialTemplateName('tools');
    }.property('sectionName'),

    /**
     * Name of the template for section toolbox.
     *
     * @property toolboxTemplate
     */
    toolboxTemplate: function() {
        return this.computePartialTemplateName('toolbox');
    }.property('sectionName'),


    computePartialTemplateName: function(partialName) {
        var templateName = '$app/$section--%@'.fmt(partialName),
            templateNameAsPartial = '$app/-$section--%@'.fmt(partialName);

        if(this.container.lookup('template:' + templateNameAsPartial)) {
            return templateName;
        }

        return null;
    }

});

export default BaseSectionController;
