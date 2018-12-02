from djcelery.models import CrontabSchedule, PeriodicTask
from accounting.models import BillPlans
import random
import json

BILL_PLANS_TASK = 'evaluator.acc_modules.bill_plans_tasks.evaluate_plan'


def schedule_bill_plan(query, plan_id):
    if query['period'] == '1':
        months = '*'
    else:
        months = query['months']
    cronRecord = CrontabSchedule(minute=random.randint(0, 59), hour=random.randint(0, 20), day_of_month=int(query['generation_date']), month_of_year=months)
    cronRecord.save()
    periodicTask = PeriodicTask(name=query['name'], task=BILL_PLANS_TASK, crontab=cronRecord, kwargs=json.dumps({"plan_id": plan_id}), enabled=True)
    periodicTask.save()
    return None


def delete_schedule_for_plan(pk):
    name = BillPlans.objects.get(pk=pk).name
    task_to_delete = PeriodicTask.objects.filter(name=name)
    if len(task_to_delete) > 0:
        task_to_delete[0].delete()
        ct = CrontabSchedule.objects.get(pk=task_to_delete[0].crontab.pk)
        ct.delete()
    return None
