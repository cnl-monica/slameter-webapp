import Ember from 'ember';

var AutoModuleTemplatesMixin = Ember.Mixin.create({

    bodyTemplate: function(){
        return this.computePartialTemplateName('body');
    }.property(),

    toolsTemplate: function(){
        return this.computePartialTemplateName('tools');
    }.property(),

    toolboxTemplate: function(){
        return this.computePartialTemplateName('toolbox');
    }.property(),

    /**
     * Compute auto partial template names.
     *
     * Name is looked up as partial name (dash in front of `.hbs` file),
     * returned name is without this first dash - Ember expect partial name
     * set on controller in that form (see ember `partial` helper docs).
     *
     * @method computePartialTemplateName
     *
     * @param {String} partialName name of the module partial to look up
     * @returns {String|null} auto template name, if found, or null
     */
    computePartialTemplateName: function(partialName) {
        var moduleName = this.get('_moduleName').dasherize(),
            templateName = '$app/modules/%@--%@'.fmt(moduleName, partialName),
            templateNameAsPartial = '$app/modules/-%@--%@'.fmt(moduleName, partialName),
            baseTemplateName = '$app/modules/base-module--%@'.fmt(partialName),
            baseTemplateNameAsPartial = '$app/modules/-base-module--%@'.fmt(partialName);

        if (this.container.lookup('template:' + templateNameAsPartial)) {
            return templateName;
        }
        if (this.container.lookup('template:' + baseTemplateNameAsPartial)) {
            return baseTemplateName;
        }

        return null;
    }
});

export default AutoModuleTemplatesMixin;
