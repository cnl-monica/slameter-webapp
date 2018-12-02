from __future__ import absolute_import
from evaluator.celery import evaluator
from .basic_bill_queries import evaluate_speed, evaluate_volume
from evaluator.acc_modules.conversion_tools import relative_months
import datetime


@evaluator.task
def basic_evaluate_task(data):
    if 'interval_type' in data and str(data['interval_type']).__contains__('last_month'):
        lm = relative_months(1)
    elif 'interval_type' in data and str(data['interval_type']).__contains__('last3m'):
        lm = relative_months(3)
    elif 'interval_type' in data and str(data['interval_type']).__contains__('absolete'):
        lm = {
            'from_utc_long': long(data['time_from']),
            'to_utc_long': long(data['time_to'])
        }

        time_from = datetime.datetime.fromtimestamp(lm['from_utc_long']/1000.0)
        lm['from_str'] = time_from.strftime("%d.%m.%Y %H:%M:%S")

        time_to = datetime.datetime.fromtimestamp(lm['to_utc_long']/1000.0)
        lm['to_str'] = time_to.strftime("%d.%m.%Y %H:%M:%S")
    else:
        return {'error': True, 'message': 'Missing mandatory fields in request !'}
    try:
        if str(data['bill_type']).__contains__('speed'):
            data = evaluate_speed(lm, data['userId'], data['eval_type'], data['base_speed'], data['base_cost'], data['additional_speed'], data['additional_cost'])
        else:
            data = evaluate_volume(lm, data['userId'], data['eval_type'], data['base_volume'], data['base_cost'], data['additional_volume'], data['additional_cost'])
        return data
    except Exception:
        return {'error': True,
                'message': 'Too little of samples or missing mandatory fields in request !',
                'intervalTimeFrom': lm['from_str'],
                'intervalTimeTo': lm['to_str']}
