from __future__ import absolute_import
from evaluator.celery import evaluator
from accounting.models import BillPlansReports, BillPlans, AccUser
from evaluator.acc_modules.basic_bill_tasks import basic_evaluate_task
from evaluator.acc_modules.invoice_tasks import evaluate_invoice
from evaluator.acc_modules.criteria_bill_tasks import evaluation
from evaluator.acc_modules.email_tools import prepare_email_fields
import datetime
import json


@evaluator.task
def evaluate_plan(**kwargs):
    success = True
    errmsg = ''
    plan_id = kwargs['plan_id']
    plan = BillPlans.objects.get(pk=int(plan_id))
    if int(plan.period) == 3:
        interval_type = 'last3m'
    else:
        interval_type = 'last_month'

    if plan.billing_type.__contains__('Speed') or plan.billing_type.__contains__('Volume'):
        input_data = {
            'interval_type': interval_type, 'userId': plan.user_id,
            'eval_type': plan.calculation_type,
            'base_cost': plan.base_tariff,
            'additional_cost': plan.additional_tariff
        }
    else:
        input_data = {
            'bill_type': 'criteria',
            'interval_type': 'named', 'userId': plan.user_id,
            'interval_value': interval_type
        }
        if plan.double_tt_criteria:
            input_data['time_tariff'] = {
                    'hour_from': plan.hour_from_criteria,
                    'hour_to': plan.hour_to_criteria
            }
        else:
            input_data['time_tariff'] = None

    if plan.billing_type.__contains__('Speed'):
        input_data['bill_type'] = 'speed'
        input_data['base_speed'] = plan.base_amount
        input_data['additional_speed'] = plan.additional_amount
    if plan.billing_type.__contains__('Volume'):
        input_data['bill_type'] = 'volume'
        input_data['base_volume'] = plan.base_amount
        input_data['additional_volume'] = plan.additional_amount
    evaluated_data = None
    user = AccUser.objects.get(pk=int(plan.user_id))
    if len(str(user.name) + ' (' + str(user.email) + ')') < 33:
        user_short_desc = str(user.name) + ' (' + str(user.email) + ')'
    else:
        user_short_desc = str(user.name)[0:32]
    gen_time = datetime.datetime.now()
    try:
        if plan.billing_type.__contains__('Speed') or plan.billing_type.__contains__('Volume'):
            evaluated_data = basic_evaluate_task(input_data)
        else:
            evaluated_data = evaluation(input_data['userId'], input_data, input_data['time_tariff'], False)
        if 'error' in evaluated_data:

            success = False
            errmsg = 'Computing data Error: ' + evaluated_data['message']
    except Exception:
        success = False
        errmsg = 'Computing data Error: Unknown error'

    if success is False:
        report = BillPlansReports(
            plan=plan, plan_name=plan.name, user=user,
            user_short_desc=user_short_desc, exec_time=gen_time.strftime("%d.%m.%Y %H:%M:%S"),
            exec_time_epoch=long(gen_time.strftime("%s")), success=False, errmsg=errmsg
        )
        print errmsg, plan.name
        report.evaluated_data = evaluated_data
        report.save()
        return {
            'success': False
        }
    evaluated_data['send'] = evaluated_data['plan_compute'] = True
    evaluated_data['type'] = input_data['bill_type']
    evaluated_data['userId'] = plan.user_id
    report = BillPlansReports(
        plan=plan, plan_name=plan.name, user=user,
        user_short_desc=user_short_desc, exec_time=gen_time.strftime("%d.%m.%Y %H:%M:%S"),
        exec_time_epoch=long(gen_time.strftime("%s"))
    )
    report.evaluated_data = evaluated_data
    invoice_data = prepare_email_fields(input_data['bill_type'], evaluated_data, plan, user)
    try:
        ret = evaluate_invoice(invoice_data)
        if ret['success'] is False:
            success = False
            errmsg = 'Generate invoice Error: ' + ret['errmsg']
    except Exception:
        success = False
        errmsg = 'Generate invoice Error: Unknown error'

    report.success = success
    report.errmsg = errmsg
    report.save()
    return {
        'success': True
    }