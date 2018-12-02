from __future__ import absolute_import
from .billexport import createBill
from evaluator.celery import evaluator
from evaluator.email_generator import send_mail


@evaluator.task
def evaluate_invoice(data):
    if data['type'] == 'criteria':
        if 'plan_compute' in data:
            billing_data = data['billing_data']['data']
        else:
            billing_data = data['billing_data']
        if 'hour_from' in data:
            criteria_invoice = {
                'billing_data': billing_data,
                'hour_from': data['hour_from'],
                'hour_from_to': data['hour_from'] + ' - ' + data['hour_to'],
                'hour_to_from': data['hour_to'] + ' - ' + data['hour_from'],
                'two_tariff': True,
                'total_sum':  data['total_sum']
            }
        else:
            criteria_invoice = {
                'two_tariff': False,
                'total_sum':  data['total_sum'],
                'billing_data': billing_data
            }
        pdf = createBill(data['userId'], data['intervalTimeFrom'], data['intervalTimeTo'], 'criteria', criteria_invoice)
        if 'send' in data:
            ret = send_mail([data['to']], data['subject'], data['text'], pdf, data['filename'])
            """
            if 'return_pdf' in data:
                return {'ret': ret, 'pdf': pdf}
            else:
            """
            return {'success': ret['success'], 'errmsg': ret['errmsg']}
        else:
            return pdf
    else:
        pdf = createBill(data['userId'], data['intervalTimeFrom'], data['intervalTimeTo'], data['type'], data)
        if 'send' in data:
            ret = send_mail([data['to']], data['subject'], data['text'], pdf, data['filename'])
            """
            if 'return_pdf' in data:
                return {'ret': ret, 'pdf': pdf}
            else:
            """
            return {'success': ret['success'], 'errmsg': ret['errmsg']}
        else:
            return pdf
