from __future__ import absolute_import
from celery import Celery
import os
from django.conf import settings


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'slaweb_api.settings.base')

evaluator = Celery('evaluator', include=[
    'evaluator.acc_modules.criteria_bill_tasks',
    'evaluator.acc_modules.summary_tasks',
    'evaluator.acc_modules.basic_bill_tasks',
    'evaluator.acc_modules.invoice_tasks',
    'evaluator.acc_modules.bill_plans_tasks',
    'evaluator.app_modules.app_module_tasks']
)
evaluator.config_from_object('django.conf:settings')


if __name__ == '__main__':
    evaluator.start()


def check_celery_workers():
    try:
        if not evaluator.control.ping():
            return {
                'error': True,
                'message': 'Celery workers unavailable'
            }
        else:
            return False

    except ValueError:
        return {'error': True,
                'message': 'Celery workers unavailable'}
