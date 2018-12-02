import AccUsersController from 'slameter/controllers/accounting/modules/accusers';
import ToolManagerMixin from 'slameter/mixins/tool-manager';

var AppUsersController = AccUsersController.extend({
    accounting: false
});

export default AppUsersController;

