from evaluator.smtpconfig import *


def prepare_email_fields(bill_type, data, plan, user):
    if 'to' not in data:
        if plan is not None:
            if plan.mail_address is not None and len(str(plan.mail_address).strip()) > 0 and not str(plan.mail_address).strip().__contains__('None'):
                data['to'] = str(plan.mail_address)
            else:
                data['to'] = user.email
    if 'subject' not in data:
        if plan is not None:
            if plan.mail_subject is not None and len(str(plan.mail_subject).strip()) > 0 and not str(plan.mail_subject).strip().__contains__('None'):
                data['subject'] = str(plan.mail_subject)
            else:
                if bill_type.__contains__('speed'):
                    data['subject'] = SPEED_SUBJECT
                elif bill_type.__contains__('volume'):
                    data['subject'] = VOLUME_SUBJECT
                else:
                    data['subject'] = CRITERIA_SUBJECT
    if bill_type.__contains__('speed') or bill_type.__contains__('volume'):
        data['intervalTimeFrom'] = data['time_from']
        data['intervalTimeTo'] = data['time_to']
        data['total_sum'] = data['total_cost']
        data = prepare_data_for_basic_bill_invoice(bill_type, data, plan)
    else:
        data['intervalTimeFrom'] = data['invoice']['intervalTimeFrom']
        data['intervalTimeTo'] = data['invoice']['intervalTimeTo']
        data['total_sum'] = data['billing_data']['total_sum']
        if plan.double_tt_criteria:
            data['hour_from'] = data['invoice']['hour_from']
            data['hour_to'] = data['invoice']['hour_to']

    if 'text' not in data:
        data['text'] = BASE_TEXT_SAL + user.name + BASE_TEXT_CONTENT
    if 'filename' not in data:
        data['filename'] = DEFAULT_FILENAME
    data['type'] = bill_type
    return data


def prepare_data_for_basic_bill_invoice(bill_type, data, plan):
    if bill_type.__contains__('speed'):
        data['calc_type'] = find_calc_type_desc(plan, 'speed')
        data['result_data'] = str(data['billing_95_interval'])
        data['billing_data'] = {
            'download': data['download'],
            'upload': data['upload']
        }
    else:
        data['calc_type'] = find_calc_type_desc(plan, 'volume')
        data['total_data'] = str(data['octet_total_count_sum'])
    data['tariff_costs'] = {
        'base_cost': plan.base_tariff,
        'base_data': plan.base_amount
    }
    if plan.additional_amount is not None and plan.additional_tariff is not None:
        data['tariff_costs']['additional_cost'] = plan.additional_tariff
        data['tariff_costs']['additional_data'] = plan.additional_amount
    return data


def find_calc_type_desc(plan, type):
    if type == 'speed':
        if plan.calculation_type.__contains__('in_out_merged'):
            calc_type = {
                'label': 'IN & OUT Merged',
                'desc': 'Take the sum(IN, OUT) for each interval and then calculate 95th percentile value from the merged records'
            }
        elif plan.calculation_type.__contains__('in_out_sep_final'):
            calc_type = {
                'label': 'IN & OUT Separate Final',
                'desc': 'Calculate the 95th percentile value of IN and 95th percentile value of OUT and then take the maximum of those two values'
            }
        else:
            calc_type = {
                'label': 'IN & OUT Separate Each',
                'desc': 'Take the max(IN, OUT) for each interval and then calculate 95th percentile value'
            }
    else:
        if plan.calculation_type.__contains__('up_down_load'):
            calc_type = {
                'label': 'UPLOAD & DOWNLOAD',
                'desc': 'Total costs will be calculated by combining both upload and download data transfer'
            }
        elif plan.calculation_type.__contains__('download'):
            calc_type = {
                'label': 'DOWNLOAD',
                'desc': 'Total costs will be calculated only by downloaded data'
            }
        else:
            calc_type = {
                'label': 'UPLOAD',
                'desc': 'Total costs will be calculated only by uploaded data'
            }
    return calc_type