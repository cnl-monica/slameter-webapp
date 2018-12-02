import Ember from 'ember';

/**
 * Builds module by looking up its view and controller,
 * connecting them together and setting helper values.
 */
var ModuleBuilderController = Ember.Controller.extend({

    /**
     * Public api for module construction
     *
     * @method buildModule
     * @api public
     *
     * @param {string} moduleName name of the module
     * @param {string} outletName name of the outlet this module will be in
     * @param {object} sectionConfig configuration of the section this module will be in
     * @param {object} app app this module belongs to
     * @param {object} moduleConfig additional module configuration to be set on controller
     * @return {*} view of newly constructed module
     */
    buildModule: function(moduleName, outletName, sectionConfig, app, moduleConfig) {
        var module = app.get('modules').findBy('name', moduleName),
            ModuleView, moduleView,
            ModuleController, moduleController,
            viewParams = {}, controllerParams = {};

        if (!module) {
            return this.buildClientSideOnlyModule(moduleName, outletName, sectionConfig, app, moduleConfig);
        }

        ModuleView = this.getModuleViewOrController('view', moduleName);
        ModuleController = this.getModuleViewOrController('controller', moduleName);

        controllerParams._moduleName = moduleName;
        controllerParams.outletName = outletName;
        controllerParams.sectionName = sectionConfig.name;
        controllerParams.content = module;

        moduleController = ModuleController.create(controllerParams);

        viewParams.controller = moduleController;

        if (moduleConfig) {
            viewParams.sizesInBrick = moduleConfig.brickSizes || [];
        }

        moduleView = ModuleView.create(viewParams);

        return moduleView;
    },

    /**
     * Builds module that is not in the list of modules loaded with app - that means this module is only on client side
     * and on server is represented probably only as a model
     *
     * @param {string} moduleName name of the module
     * @param {string} outletName name of the outlet
     * @param {object} sectionConfig configuration of the section this module will be in
     * @param {object} [app] app this module belongs to
     * @param [moduleConfig] additional module configuration to be set on controller
     * @return {*} module view
     */
    buildClientSideOnlyModule: function(moduleName, outletName, sectionConfig, app, moduleConfig) {
        var ModuleView, moduleView,
            ModuleController, moduleController,
            viewParams = {}, controllerParams = {};

        ModuleView = this.getModuleViewOrController('view', moduleName);
        ModuleController = this.getModuleViewOrController('controller', moduleName);

        if (ModuleController) {
            controllerParams._moduleName = moduleName;
            controllerParams.outletName = outletName;
            controllerParams.sectionName = sectionConfig.name;
            moduleController = ModuleController.create(controllerParams);
            viewParams.controller = moduleController;
        }

        if (ModuleView) {
            moduleView = ModuleView.create(viewParams);
            return moduleView;
        }

        return null;
    },

    /**
     * Performs lookup for module-specific view or controller
     * on active app. Example order of lookup for view of module
     * named `TestModule` with active app named `activeApp`:
     *   # view:$app.modules.TestModule -> slameter/views/activeApp/modules/test-module
     *   # view:modules.TestModule      -> slameter/views/modules/test-module
     *   # view:$app.baseModule         -> slameter/views/activeApp/base-module
     *   # view:baseModule              -> slameter/views/base-module
     * Lookup stops at first successful lookup result.
     * Lookups for controllers are done the same way.
     * Module-specific classes should inherit from baseModule classes.
     *
     * @method getModuleViewOrController
     *
     * @param {String} type `view` or `controller`
     * @param {String} moduleName name of the module
     * @returns {BaseModuleView|BaseModuleController|null} looked up view or controller class
     */
    getModuleViewOrController: function(type, moduleName) {
        var moduleVoC = this.container.lookupFactory(type + ':$app.modules.' + moduleName);

        if (!moduleVoC) {
            moduleVoC = this.container.lookupFactory(type + ':$app.baseModule');
        }

        return moduleVoC;
    }

});

export default ModuleBuilderController;
