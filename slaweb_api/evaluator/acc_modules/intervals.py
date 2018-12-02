from evaluator.acc_modules.conversion_tools import today, relative_days, relative_hours, relative_months


def get_named_interval(data):
    if str(data['interval_value']).__contains__('last_hour'):
        return relative_hours(1)
    elif str(data['interval_value']).__contains__('last_day'):
        return relative_days(1)
    elif str(data['interval_value']).__contains__('today'):
        return today()
    elif str(data['interval_value']).__contains__('last3m'):
        return relative_months(3)
    else:
        return relative_months(1)


def get_relative_interval(data):
    if str(data['interval_value']).__contains__('hours'):
        return relative_hours(str(data['interval_second_value']))
    elif str(data['interval_value']).__contains__('days'):
        return relative_days(str(data['interval_second_value']))
    else:
        return relative_months(str(data['interval_second_value']))
