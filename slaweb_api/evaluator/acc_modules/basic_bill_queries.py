import re
from accounting.models import AccUser
from netaddr import *
from conversion_tools import *
from evaluator.mongo_client import MongoConnection


def evaluate_volume(time_dict, user_id, eval_type, base_speed, base_cost, add_speed, add_cost):

    user_object = AccUser.objects.get(pk=int(user_id))
    ip_address_array = []
    projection = {'octetdeltacount': 1}
    if len(str(user_object.ip_addresses).strip()) != 0 and user_object.ip_addresses is not None:
        address_list = re.split(';', user_object.ip_addresses)
        for address in address_list:
            if "/" not in address:
                ip_address_array.append(ip_to_binary(address))
            else:
                for ip in IPNetwork(address):
                    ip_address_array.append(ip_to_binary(str(ip)))

    mac_address_array = []
    if len(str(user_object.mac_addresses).strip()) != 0 and user_object.mac_addresses is not None:
        address_list = re.split(';', user_object.mac_addresses)
        for address in address_list:
                mac_address_array.append(mac_to_binary(address))

    date_time = {'datetime': {'$gte': time_dict['from_utc_long'], '$lte': time_dict['to_utc_long']}}
    if len(mac_address_array) > 0:
        download = {'$or': [
                    {'destinationmacaddress': {'$in': mac_address_array}},
                    {'destinationipv4address': {'$in': ip_address_array}}]
                    }
        upload = {'$or': [
                   {'sourcemacaddress': {'$in': mac_address_array}},
                   {'sourceipv4address': {'$in': ip_address_array}}]
                   }
        match_for_download = {'$match': {'datetime': date_time['datetime'], '$or': download['$or']}}
        match_for_upload = {'$match': {'datetime': date_time['datetime'], '$or': upload['$or']}}
    else:
        match_for_download = {'$match': {'datetime': date_time['datetime'], 'destinationipv4address': {'$in': ip_address_array}}}
        match_for_upload = {'$match': {'datetime': date_time['datetime'], 'sourceipv4address': {'$in': ip_address_array}}}

    group = {
            '$group': {
                '_id': 'null',
                'octets': {
                        '$sum': '$octetdeltacount'
                }
            }
    }

    download_aggregate_query = [match_for_download, group]
    upload_aggregate_query = [match_for_upload, group]

    db_connection = MongoConnection()
    db = db_connection.get_def_database()
    acc_records = db.acc_records
    # Download line in  graph
    down_result = acc_records.aggregate(download_aggregate_query)
    up_result = acc_records.aggregate(upload_aggregate_query)
    if not down_result['result']:
        download_data = 0
    else:
        download_data = down_result['result'][0]['octets']
    if not up_result['result']:
        upload_data = 0
    else:
        upload_data = up_result['result'][0]['octets']


    # UPLOAD & DOWNLOAD
    if str(eval_type).__contains__('up_down_load'):
        total_cost = get_billing_data(float(base_speed), float(base_cost), add_speed, add_cost, download_data + upload_data)
    elif str(eval_type).__contains__('download'):
        total_cost = get_billing_data(float(base_speed), float(base_cost), add_speed, add_cost, download_data)
    else:
        total_cost = get_billing_data(float(base_speed), float(base_cost), add_speed, add_cost, upload_data)

    response = {
        'octet_total_count_download': download_data,
        'octet_total_count_upload': upload_data,
        'octet_total_count_sum': download_data + upload_data,
        'time_from': time_dict['from_str'],
        'time_to': time_dict['to_str'],
        'total_cost': total_cost
    }
    return response


def evaluate_speed(time_dict, user_id, eval_type, base_speed, base_cost, add_speed, add_cost):
    time_periods = 5 * 60 * 1000
    time_period_sec = 5 * 60
    # default time_periods for 95-percentile evaluation in miliseconds -> 5 minutes samples
    user_object = AccUser.objects.get(pk=int(user_id))
    mac_address_array = []
    ip_address_array = []
    if len(str(user_object.ip_addresses).strip()) != 0 and user_object.ip_addresses is not None:
        address_list = re.split(';', user_object.ip_addresses)
        for address in address_list:
            if "/" not in address:
                ip_address_array.append(ip_to_binary(address))
            else:
                for ip in IPNetwork(address):
                    ip_address_array.append(ip_to_binary(str(ip)))

    if len(str(user_object.mac_addresses).strip()) != 0 and user_object.mac_addresses is not None:
        address_list = re.split(';', user_object.mac_addresses)
        for address in address_list:
                mac_address_array.append(mac_to_binary(address))

    date_time = {'datetime': {'$gte': time_dict['from_utc_long'], '$lte': time_dict['to_utc_long']}}
    if len(mac_address_array) > 0:
        download = {'$or': [
                    {'destinationmacaddress': {'$in': mac_address_array}},
                    {'destinationipv4address': {'$in': ip_address_array}}]
                    }
        upload = {'$or': [
                   {'sourcemacaddress': {'$in': mac_address_array}},
                   {'sourceipv4address': {'$in': ip_address_array}}]
                   }
        match_for_download = {'$match': {'datetime': date_time['datetime'], '$or': download['$or']}}
        match_for_upload = {'$match': {'datetime': date_time['datetime'], '$or': upload['$or']}}
    else:
        match_for_download = {'$match': {'datetime': date_time['datetime'], 'destinationipv4address': {'$in': ip_address_array}}}
        match_for_upload = {'$match': {'datetime': date_time['datetime'], 'sourceipv4address': {'$in': ip_address_array}}}

    group = {
            '$group': {
                '_id': {
                    '$subtract': [
                        '$datetime',
                        {
                                '$mod': [
                                    '$datetime', time_periods
                                ]
                        }
                        ]
                    },
                    'octets': {
                        '$sum': '$octetdeltacount'
                }
            }
    }
    sort_for_graph = {'$sort': {'_id': 1}}
    sort_for_bill = {'$sort': {'octets': 1}}
    download_graph_query = [match_for_download, group, sort_for_graph]
    upload_graph_query = [match_for_upload, group, sort_for_graph]
    download_bill_query = [match_for_download, group, sort_for_bill]
    upload_bill_query = [match_for_upload, group, sort_for_bill]

    # Format data for graph
    db_connection = MongoConnection()
    db = db_connection.get_def_database()
    acc_records = db.acc_records
    # Download line in  graph
    download_graph_raw_data = acc_records.aggregate(download_graph_query)
    download_graph_data = []
    download_samples_count = download_octets = 0
    for record in download_graph_raw_data['result']:
        download_graph_data.append([record['_id'], (record['octets']*8)/300])
        download_samples_count += 1
        download_octets += record['octets']

    # Upload line in graph
    upload_graph_raw_data = acc_records.aggregate(upload_graph_query)
    upload_graph_data = []
    upload_samples_count = upload_octets = 0

    for record in upload_graph_raw_data['result']:
        upload_graph_data.append([record['_id'], (record['octets']*8)/300])
        upload_samples_count += 1
        upload_octets += record['octets']

    # All samples, with zero samples which are not provided by database    interval/msec_of_day * samples_on_day
    all_samples_count = round(float(time_dict['to_utc_long']-time_dict['from_utc_long'])/float(24*60*60*1000))*24*12

    diff_for_subtract = round(all_samples_count*0.05) + 1
    down_smp_for_bill_index = download_samples_count - diff_for_subtract
    up_smp_for_bill_index = upload_samples_count - diff_for_subtract
    download_bill_raw_data = acc_records.aggregate(download_bill_query)
    upload_bill_raw_data = acc_records.aggregate(upload_bill_query)
    # Maximum bps
    max_download_bps = (download_bill_raw_data['result'][download_samples_count-1]['octets'] * 8) / time_period_sec
    max_upload_bps = (upload_bill_raw_data['result'][upload_samples_count-1]['octets'] * 8) / time_period_sec

    # Minumum bps
    if download_samples_count == all_samples_count:
        min_download_bps = (download_bill_raw_data['result'][0]['octets'] * 8) / time_period_sec
    else:
        min_download_bps = 0

    if upload_samples_count == all_samples_count:
        min_upload_bps = (upload_bill_raw_data['result'][0]['octets'] * 8) / time_period_sec
    else:
        min_upload_bps = 0

    # Average bps
    avg_download_bps = (download_octets * 8 / 300) / all_samples_count
    avg_upload_bps = (upload_octets * 8 / 300) / all_samples_count

    # 95-percentile billing types and evaluation
    merged_records = []
    if eval_type == 'in_out_sep_final':
        download_95_bps = (download_bill_raw_data['result'][int(down_smp_for_bill_index)]['octets'] * 8) / time_period_sec
        upload_95_bps = (upload_bill_raw_data['result'][int(up_smp_for_bill_index)]['octets'] * 8) / time_period_sec
        if download_95_bps > upload_95_bps:
            billing_95_interval = download_95_bps
        else:
            billing_95_interval = upload_95_bps
    elif eval_type == 'in_out_merged':
        for c in range(0, download_samples_count):
            merged_records.append(upload_bill_raw_data['result'][c]['octets'] + download_bill_raw_data['result'][c]['octets'])
        merged_records.sort()
        billing_95_interval = (merged_records[int(down_smp_for_bill_index)]*8) / time_period_sec
    else:
        for c in range(0, download_samples_count):
            if upload_bill_raw_data['result'][c]['octets'] > download_bill_raw_data['result'][c]['octets']:
                merged_records.append(upload_bill_raw_data['result'][c]['octets'])
            else:
                merged_records.append(download_bill_raw_data['result'][c]['octets'])
        merged_records.sort()
        billing_95_interval = (merged_records[int(down_smp_for_bill_index)]*8) / time_period_sec

    total_cost = get_billing_data(float(base_speed), float(base_cost), add_speed, add_cost, billing_95_interval)

    downData = {
        'data': download_graph_data,
        'label': 'Downloaded/Input data'
    }

    upData = {
        'data': upload_graph_data,
        'label': 'Uploaded/Output data'
    }

    if download_graph_raw_data['result'][0]['_id'] < upload_graph_raw_data['result'][0]['_id']:
        first_point = download_graph_raw_data['result'][0]['_id']
    else:
        first_point = upload_graph_raw_data['result'][0]['_id']
    if download_graph_raw_data['result'][0]['_id'] > upload_graph_raw_data['result'][0]['_id']:
        last_point = download_graph_raw_data['result'][download_samples_count-1]['_id']
    else:
        last_point = upload_graph_raw_data['result'][upload_samples_count-1]['_id']

    perc_line = {
        'data': [[first_point, billing_95_interval], [last_point, billing_95_interval]],
        'label': '95th percentile',
        'color': 'black'
    }
    data = {
        'graph': {
            'downData': downData,
            'upData': upData,
            'percentil': perc_line
        },
        'download': {
            'download_total_bytes': download_octets,
            'min_download_bps': min_download_bps,
            'avg_download_bps': avg_download_bps,
            'max_download_bps': max_download_bps
        },
        'upload': {
            'upload_total_bytes': upload_octets,
            'min_upload_bps': min_upload_bps,
            'avg_upload_bps': avg_upload_bps,
            'max_upload_bps': max_upload_bps
        },
        'billing_95_interval': billing_95_interval,
        'time_from': time_dict['from_str'],
        'time_to': time_dict['to_str'],
        'total_cost': total_cost
        }

    db_connection.close_connection()
    return data


def get_billing_data(base_speed_or_vol, base_cost, add_speed_or_vol, add_cost, vol_or_speed_for_bill):
    if base_speed_or_vol > vol_or_speed_for_bill:
        total_costs = base_cost
    elif str(add_cost) == '' or add_cost is None or str(add_speed_or_vol) == '' or add_speed_or_vol is None:
        total_costs = float(long((float(vol_or_speed_for_bill) / float(base_speed_or_vol)))) * base_cost
    else:
        total_costs = float(base_cost) + float(long((vol_or_speed_for_bill - float(base_speed_or_vol)) / float(add_speed_or_vol))) * float(add_cost)

    return round(total_costs, 2)