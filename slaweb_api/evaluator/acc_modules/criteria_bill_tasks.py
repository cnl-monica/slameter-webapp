from __future__ import absolute_import
from .conversion_tools import last_day
from accounting.models import AccCriteria, AccUser
from .criteria_bill_queries import evaluate_criteria, get_bill_data_for_criteria
from evaluator.celery import evaluator
from .intervals import get_named_interval, get_relative_interval
import datetime


@evaluator.task
def evaluation(user_id, data, time_tariff, default):
    if default is True and not AccUser.objects.filter(pk=int(user_id)).exists():
        result = {
            'message': 'This Accounting User does not exist'
        }
        return result

    user_object = AccUser.objects.get(pk=int(user_id))
    acc_criteria = AccCriteria.objects.all().filter(user=user_object).order_by('priority')
    if default is True:
        def_interval = last_day()
        interval = {
                "time_from": def_interval['from_utc_long'],
                "time_to": def_interval['to_utc_long']
        }
        interval_from_string = def_interval['from_str']
        interval_to_string = def_interval['to_str']
    else:
        lm = None
        if 'interval_type' in data and str(data['interval_type']).__contains__('named'):
            lm = get_named_interval(data)
        elif 'interval_type' in data and str(data['interval_type']).__contains__('relative'):
            lm = get_relative_interval(data)
        else:
            lm = {}
            lm['from_utc_long'] = long(data['time_from'])
            time_from = datetime.datetime.fromtimestamp(lm['from_utc_long']/1000.0)
            lm['from_str'] = time_from.strftime("%d.%m.%Y %H:%M:%S")

            lm['to_utc_long'] = long(data['time_to'])
            time_to = datetime.datetime.fromtimestamp(lm['to_utc_long']/1000.0)
            lm['to_str'] = time_to.strftime("%d.%m.%Y %H:%M:%S")


        interval = {
                "time_from": lm['from_utc_long'],
                "time_to": lm['to_utc_long']
        }
        interval_from_string = lm['from_str']
        interval_to_string = lm['to_str']

    if len(acc_criteria) == 0:
            return {
                "info": True,
                "error": True,
                "message": "User hasn't criteria !",
                "intervalTimeFrom": interval_from_string,
                "intervalTimeTo": interval_to_string

            }
    else:
        if time_tariff is not None or default is True:
            if default is True:
                time_tariff = {
                    'hour_from': '8',
                    'hour_to': '16'
                }
            else:
                time_tariff = {
                    'hour_from': time_tariff['hour_from'],
                    'hour_to': time_tariff['hour_to']
                }

            first_columns = evaluate_criteria(user_id, acc_criteria, interval, time_tariff, True)
            second_columns = evaluate_criteria(user_id, acc_criteria, interval, time_tariff, False)

            billing_data = get_bill_data_for_criteria(True, [first_columns, second_columns])



            result = {
                'title': 'Data per Accounting Criteria for selected Entity for Period From: '
                         + interval_from_string + ' To: ' + interval_to_string,
                'strong_traffic_rate_colls': {
                    'label': 'Strong Traffic time: ' + str(time_tariff['hour_from']) + ':00' + ' - ' + str(time_tariff['hour_to']) + ':00',
                    'data': first_columns
                },
                'weak_traffic_rate_colls': {
                    'label': 'Weak Traffic time: ' + str(time_tariff['hour_to']) + ':00' + ' - ' + str(time_tariff['hour_from']) + ':00',
                    'data': second_columns
                },
                'billing_data': billing_data,
                'invoice': {
                    'intervalTimeFrom': interval_from_string,
                    'intervalTimeTo': interval_to_string,
                    'hour_from': str(time_tariff['hour_from']) + ':00',
                    'hour_to': str(time_tariff['hour_to']) + ':00',
                    'two_tariff': True
                }

            }
        else:
            columns = evaluate_criteria(user_id, acc_criteria, interval, None, None)
            billing_data = get_bill_data_for_criteria(False, [columns])

            result = {
                'title': 'Data per Accounting Criteria for selected Entity for Period From: '
                         + interval_from_string + ' To: ' + interval_to_string,
                'colls':  {
                    'data': columns,
                    'label': False
                }
                ,
                'billing_data': billing_data,
                'invoice': {
                    'intervalTimeFrom': interval_from_string,
                    'intervalTimeTo': interval_to_string,
                    'two_tariff': False
                },
                'two_tariff': False
            }
        return result