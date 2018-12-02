import IdsBaseModuleController from './base-module';

/**
 * Module with chart, has modified data setup to the format
 * required by Flot
 */

var IdsBaseModuleWithChartController = IdsBaseModuleController.extend({


    toolboxTemplate: 'ids/modules/common-wall-module--toolbox',
    toolsTemplate: 'ids/modules/common-wall-module--tools'
});

export default IdsBaseModuleWithChartController;

