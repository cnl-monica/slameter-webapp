import Ember from 'ember';

var BaseSectionRoute = Ember.Route.extend({
    /**
     * Token for page title creation - title of the section.
     *
     * @param model model of the route
     * @returns {String} title of the section
     */
    titleToken: function(model) {
        return model.get('sectionConfig.title');
    },

    /**
     * Compute name for controller that will be used wit this route.
     * Computation consists of lookup for controller with same name as this
     * rote's real name ('base-section' name is replaced ba route with actual
     * name of app and section this route fills-in for). If such a name is not
     * found, lookup with variables is used to fall-back to base-section controller.
     *
     * This method is called in `afterModel` hook, as it is not possible to use name
     * variables sooner, as they are not set up until that point.
     *
     * @method computeControllerName
     */
    computeControllerName: function() {
        if (this.container.lookup('controller:' + this.get('routeName'))) {
            this.set('controllerName', this.get('routeName'));
        } else {
            this.set('controllerName', '$app.baseSection');
        }
    },

    /**
     * Gives reference to module builder controller.
     *
     * @property moduleBuilder
     */
    moduleBuilder: function() {
        return this.container.lookup('controller:$app.moduleBuilder', {singleton: true});
    }.property(),

    model: function() {
        var nameParts = this.routeName.split('.'),
            appName = nameParts[0],
            sectionName = nameParts[1],
            activeApp = this.modelFor(appName);

        return Ember.Object.create({
            app: activeApp,
            sectionConfig: activeApp.get('config.sections').findBy('name', sectionName),
            modules: []
        });
    },

    afterModel: function(model) {
        this.controllerFor('application').set('activeSection', Ember.get(model, 'sectionConfig.name'));
        this.computeControllerName();
    },

    /**
     * Setup of controllers for outlets consists of module building phase.
     * Modules are built according to configuration loaded from server.
     *
     * @method setupController
     * @param {BaseSectionController} controller controller for this route, instantiated by
     * Ember from name set in `computeControllerName` method.
     * @param {Object} model model of the route
     */
    setupController: function(controller, model) {
        var flattenedModules, flattenedWallModules, flattenedSummaryModules,
            sectionConfig = Ember.get(model, 'sectionConfig'),
            wallModules = this.buildModules('wall', sectionConfig),
            summaryModules = this.buildModules('summary', sectionConfig),
            navigationModules = this.buildNavigationModules(sectionConfig);

        // controller is interested only in module list, they do not need to be nested in groups,
        // as it would complicate communication process between them
        flattenedWallModules = wallModules.reduce(function(a,b){return a.concat(b);},[]);
        flattenedSummaryModules = summaryModules.reduce(function(a,b){return a.concat(b);},[]);
        flattenedModules = flattenedWallModules.concat(flattenedSummaryModules).concat(navigationModules);

        // simple flattened array of modules is set in model for this route's controller
        model.set('modules', flattenedModules);
        controller.set('model', model);

        // controllers for module groups are looked up and appropriate modules are set as their models
        this.controllerFor('$app.wall').set('model', wallModules);
        this.controllerFor('$app.summary').set('model', summaryModules);
        this.controllerFor('$app.sectionNavigation').set('model', navigationModules);

        // set sidebar visibility
        this.controllerFor('application').set('hasLeftSidebar', !!summaryModules.length);
        this.controllerFor('application').set('hasRightSidebar', !!navigationModules.length);
    },

    /**
     * Classical Ember `renderTemplate` hook, where outlets are rendered with
     * content created in previous steps.
     *
     * @method renderTemplate
     * @param {BaseSectionController} controller same controller as for `setupController`
     * @param {Object} model model for this route
     */
    renderTemplate: function(controller, model) {
        this.render('wall', {
            controller: this.controllerFor('$app.wall')
        });

        this.render('summary', {
            outlet: 'leftSidebar',
            controller: this.controllerFor('$app.summary')
        });

        this.render('sectionNavigation', {
            outlet: 'rightSidebar',
            controller: this.controllerFor('$app.sectionNavigation')
        });

        this.render('section-tools-wrapper', {
            outlet: 'toolsWrapper'
        });

        this.render('section-toolbox-wrapper', {
            outlet: 'toolboxWrapper'
        });

    },

    /**
     * This parses configuration for outlets and for each module name it find it builds full
     * module using module builder controller.
     *
     * @method buildModules
     * @param {String} outletName name for the outlet
     * @param {Object} sectionConfig configuration object for this section
     * @return {Array} array of modules for outlet
     */
    buildModules: function(outletName, sectionConfig) {
        var self = this,
            modules,
            app = this.modelFor(this.controllerFor('application').get('activeApp')),
            moduleNamesForOutlet;

        if (!sectionConfig['modules']) {
            return [];
        }

        moduleNamesForOutlet = sectionConfig['modules'][outletName];

        if (!Ember.isArray(moduleNamesForOutlet)) {
            return [];
        }

        modules = moduleNamesForOutlet.map(function(item) {
            var modArray, moduleName, config;

            if (Ember.isArray(item)) {
                // configuration contains array of module names,
                // build module for each of them
                modArray = item.map(function(moduleName) {
                    return self.buildModule(moduleName, outletName, sectionConfig, app);
                });
            } else if (typeof item === 'object' && item) {
                // configuration contains object, that should define `modules` property
                // and additional configuration common to all those modules.
                // Typically this would mean brick configuration, which, beside module names,
                // contains brick sizes for different brick layouts, like this:
                //  {"modules": ["MyModuleName", ...], "brickSizes": ["wide-3", "narrow-2"]}
                // Note: brick can contain multiple modules, that will be `glued` together.

                // config is copied, then `modules` property is deleted,
                // so this config object may be passed to buildModule method
                config = Ember.copy(item);
                delete config.modules;

                if (Ember.isArray(item.modules)) {
                    // `module` property is array (e.g. multiple modules in one brick)
                    modArray = item.modules.map(function(moduleName){
                        return self.buildModule(moduleName, outletName, sectionConfig, app, config);
                    });
                } else {
                    // single module, make it array of single item for proper insertion in view
                    moduleName = item.modules;
                    modArray = [self.buildModule(moduleName, outletName, sectionConfig, app, config)];
                }
            } else  {
                // single module, make it array of single item for proper insertion in view
                modArray = [self.buildModule(item, outletName, sectionConfig, app)];
            }

            // if some modules were not built (name did not match any of the app module's name)
            // this removes all undefined items in array
            modArray = modArray.compact();

            // return an array only if it is not empty
            return modArray.length ? modArray : null;
        });

        return modules.compact();
    },

    buildNavigationModules: function(sectionConfig) {
        var self = this,
            modules,
            app = this.modelFor(this.controllerFor('application').get('activeApp')),
            moduleNamesForOutlet;

        if (!sectionConfig['modules']) {
            return [];
        }

        moduleNamesForOutlet = sectionConfig['modules']['navigation'];

        if (!moduleNamesForOutlet) {
            // navigation modules not configured, return empty array
            return [];
        }

        Ember.assert('navigation configuration in app ' + app.get('name') + '`s section ' /
            + Ember.get('sectionConfig.name') + ' should be an array of module names.',
            Ember.isArray(moduleNamesForOutlet));

        modules = moduleNamesForOutlet.map(function(item) {
            return self.buildModule(item, 'navigation', sectionConfig, app);
        });

        return modules.compact();
    },

    /**
     *
     * @method buildModule
     *
     * @param moduleName
     * @param outletName
     * @param sectionConfig
     * @param app
     * @param [moduleConfig]
     *
     * @returns {BaseModuleView}
     */
    buildModule: function(moduleName, outletName, sectionConfig, app, moduleConfig) {
        return this.get('moduleBuilder').buildModule(moduleName, outletName, sectionConfig, app, moduleConfig);
    },

    serializeQueryParam: function(value, urlKey, defaultValueType) {
        // additional serialization check for arrays, as they are sometimes
        // stringified, even if they were already turned to strings
        if (defaultValueType === 'array'){
            if (Ember.isArray(value)) {
                return JSON.stringify(value);
            }
            return '' + value;
        }
        if (defaultValueType === 'object') {
            if (typeof value === 'object') {
                try {
                    return window.Base64.encode(JSON.stringify(value));
                } catch (e) {
                    // TODO
                }
            }
            return '' + value;

        }
        return this._super.apply(this, arguments);
    },

    deserializeQueryParam: function(value, urlKey, defaultValueType) {
        if (defaultValueType === 'object') {
            try {
                return JSON.parse(window.Base64.decode(value));
            } catch (e) {
                // TODO
            }
        }
        return this._super.apply(this, arguments);
    },

    actions: {
        finalizeQueryParamChange: function(params, finalParams, transition) {
            var ret = this._super.apply(this, arguments);
            this.controller.trigger('queryParamsChanged', finalParams);
            Ember.run.next(this, function(){

            this.controller.sendNavigationToModules();

            });

            if (!window.localStorage.noAutoModuleLoad) {
                this.controller.trigger('loadModules', true);
            } else {
                this.controller.trigger('applyFilterOnModules');
            }
            return ret;
        },

        reloadModules: function() {
            this.controller.trigger('loadModules', false);
        },

        /**
         * Notify controller of intended transition,
         * so it can take required actions
         */
        willTransition: function() {
            this.controller.trigger('routeWillTransition');
        }
    }

});

export default BaseSectionRoute;
