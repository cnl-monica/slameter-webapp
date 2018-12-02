import Model from '../main';
import {attr} from '../main';

var AccPlanReport = Model.extend({
    id: attr(),
    user: attr(),
    plan: attr(),
    plan_name: attr(),
    user_short_desc: attr(),
    exec_time: attr(),
    exec_time_epoch: attr(),
    success: attr(),
    errmsg: attr(),
    evaluated_data: attr()
});

AccPlanReport.url = '/apps/accounting/BillingReports/';
AccPlanReport.primaryKey = 'id';

export default AccPlanReport;
