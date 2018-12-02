from acc_modules.criteria_bill_tasks import evaluation
from acc_modules.invoice_tasks import evaluate_invoice
from acc_modules.summary_tasks import comp_users
from acc_modules.basic_bill_tasks import basic_evaluate_task
from app_modules.app_module_tasks import basic_task
from celery import check_celery_workers


def default_criteria_evaluate(user_id):
    check_res = check_celery_workers()
    if check_res:
        return check_res
    result = {}
    if user_id is None:
        message = "Not chosen user for evaluating"
        result['message'] = message
        return result
    elif num(user_id) is False:
        message = "Bad request"
        result['message'] = message
        return result
    else:
        try:
            res = evaluation.delay(int(user_id), None, None, True).get()
            if 'error' in res:
                return res
            response = {"data": res}
            return response

        except RuntimeError:
            result['message'] = 'This User does not exist !'
            return result


def criteria_evaluate(data):
    check_res = check_celery_workers()
    if check_res:
        return check_res
    user_id = data['userId']
    interval = data
    if 'time_tariff' in data:
        time_tariff = data['time_tariff']
    else:
        time_tariff = None
    # data = evaluation.delay(user_id, data, time_tariff, False)
    # response = {
    #   "data": data.get()
    # }
    res = evaluation.delay(user_id, data, time_tariff, False).get()
    # res = evaluation(user_id, data, time_tariff, False)
    if 'error' in res:
        return res
    response = {"data": res}
    return response


def create_invoice(data):
    return evaluate_invoice.delay(data).get()


def compare_users(data):
    check_res = check_celery_workers()
    if check_res:
        return check_res
    return comp_users.delay(data).get()


def basic_evaluation(data):
    check_res = check_celery_workers()
    if check_res:
        return check_res
    return basic_evaluate_task.delay(data).get()


def basic_applications_evaluation(data):
    check_res = check_celery_workers()
    if check_res:
        return check_res
    return basic_task.delay(data).get()


def num(s):
    try:
        int(s)
        return True
    except ValueError:
        return False