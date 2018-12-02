import Model from '../main';
import {attr} from '../main';

var AccPlan = Model.extend({
    id: attr(),
    user_id: attr(),
    name: attr(),
    description: attr(),
    billing_type: attr(),
    calculation_type: attr(),
    base_amount: attr(),
    additional_amount: attr(),
    base_tariff: attr(),
    additional_tariff: attr(),
    generation_date: attr(),
    period: attr(),
    months: attr(),
    double_tt_criteria: attr(),
    hour_from_criteria: attr(),
    hour_to_criteria: attr(),
    mail_address: attr(),
    mail_subject: attr()

});

AccPlan.url = '/apps/accounting/BillingPlans/';
AccPlan.primaryKey = 'id';

export default AccPlan;

