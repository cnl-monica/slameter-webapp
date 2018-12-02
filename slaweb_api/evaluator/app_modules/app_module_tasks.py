from __future__ import absolute_import
from evaluator.celery import evaluator
from evaluator.acc_modules.intervals import get_named_interval, get_relative_interval
from accounting.models import AccUser
from .app_module_queries import *
from evaluator.acc_modules.conversion_tools import *
from netaddr import *
import datetime
import re


@evaluator.task
def basic_task(data):
    # Input parameters
    if 'time' in data and str(data['time']['interval_type']).__contains__('named'):
        lm = get_named_interval(data['time'])
    elif 'time' in data and str(data['time']['interval_type']).__contains__('relative'):
        lm = get_relative_interval(data['time'])
    elif 'time' in data and str(data['time']['interval_type']).__contains__('absolete'):
        lm = {'from_utc_long': long(data['time']['time_from'])}
        time_from = datetime.datetime.fromtimestamp(lm['from_utc_long']/1000.0)
        lm['from_str'] = time_from.strftime("%d.%m.%Y %H:%M:%S")

        lm['to_utc_long'] = long(data['time']['time_to'])
        time_to = datetime.datetime.fromtimestamp(lm['to_utc_long']/1000.0)
        lm['to_str'] = time_to.strftime("%d.%m.%Y %H:%M:%S")
    else:
        lm = last_hour()
    datetime_query = {'$gte': lm['from_utc_long'], '$lte': lm['to_utc_long']}
    ip_address_array = []
    mac_address_array = []
    if 'userId' in data and data['userId'] != 'all':
        user_id = data['userId']
        user_object = AccUser.objects.get(pk=int(user_id))
        ip_address_array = get_ip_address_list(user_object, ip_address_array)
        mac_address_array = get_mac_address_list(user_object, mac_address_array)
    else:
        users = AccUser.objects.all().order_by('id')
        if len(users) == 0:
            return {
                'info': True,
                'message': 'No accounting entity in database !'
            }
        else:
            for user in users:
                get_ip_address_list(user, ip_address_array)
                get_mac_address_list(user, mac_address_array)
    match_query = get_match_query(ip_address_array, mac_address_array, datetime_query)
    module_name = data['name']
    return globals()[module_name](match_query[0], match_query[1], lm, None)


def get_ip_address_list(user_object, ip_address_array):
    if len(str(user_object.ip_addresses).strip()) != 0 and user_object.ip_addresses is not None:
        address_list = re.split(';', user_object.ip_addresses)
        for address in address_list:
            if "/" not in address:
                ip_address_array.append(ip_to_binary(address))
            else:
                for ip in IPNetwork(address):
                    ip_address_array.append(ip_to_binary(str(ip)))
        return ip_address_array
    else:
        return ip_address_array


def get_mac_address_list(user_object, mac_address_array):
    if len(str(user_object.mac_addresses).strip()) != 0 and user_object.mac_addresses is not None:
        address_list = re.split(';', user_object.mac_addresses)
        for address in address_list:
                mac_address_array.append(mac_to_binary(address))
        return mac_address_array
    else:
        return mac_address_array


def get_match_query(ip_address_array, mac_address_array, datetime_query):
    if len(mac_address_array) != 0:
        download_addresses = {'$or': [
                    {'destinationmacaddress': {'$in': mac_address_array}},
                    {'destinationipv4address': {'$in': ip_address_array}}]
        }
        upload_addresses = {'$or': [
                    {'sourcemacaddress': {'$in': mac_address_array}},
                    {'sourceipv4address': {'$in': ip_address_array}}]
        }
        match_for_download = {'$match': {'datetime': datetime_query, '$or': download_addresses['$or']}}
        match_for_upload = {'$match': {'datetime': datetime_query, '$or': upload_addresses['$or']}}
    else:
        match_for_download = {'$match': {'datetime': datetime_query, 'destinationipv4address': {'$in': ip_address_array}}}
        match_for_upload = {'$match': {'datetime': datetime_query, 'sourceipv4address': {'$in': ip_address_array}}}
    return [match_for_download, match_for_upload]