from netaddr import *
from evaluator.acc_modules.conversion_tools import mac_to_binary, last_month_interval
from conversion_tools import ip_to_binary, last_hour
from evaluator.mongo_client import MongoConnection
from accounting.models import AccUser
import re
import datetime
from intervals import get_named_interval, get_relative_interval


def getDataForCompUsersGraph(data):
    lm = None

    """"
        if data is None:
            time_from = None
            time_to = None
        else:
            if data.get('time_from', None) is None:
                time_from = None
            else:
                time_from = data.get('time_from', None)
            if data.get('time_to', None) is None:
                time_to = None
            else:
                time_to = data.get('time_to', None)
    """
    sub_query11 = sub_query12 = sub_query21 = sub_query22 = None
    if data is None:
        # default interval, in past last_month, now last hour because it is cost intensive
        # lm = last_month_interval()
        lm = last_hour()
    else:
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

    time_from = lm['from_utc_long']
    time_to = lm['to_utc_long']
    time_from_string = lm['from_str']
    time_to_string = lm['to_str']

    downloadData = []
    uploadData = []
    users = AccUser.objects.all().order_by('id')

    if users.__len__() == 0:
        data = {
            'no_users': True,
            'message': 'No accounting clients in database !',
            'downData': [[]],
            'upData': [[]],
            'time_from': time_from,
            'time_to': time_to
        }

        return data

    connection = MongoConnection()
    db = connection.get_def_database()
    records = db.acc_records

    for user in users:
        query1 = {
        }
        query2 = {
        }
        projection = {
        "octetdeltacount": 1
        }
        address_array = []
        if len(str(user.ip_addresses).strip()) != 0 and user.ip_addresses is not None:
            addressList = re.split(';', user.ip_addresses)
            for address in addressList:
                if "/" not in address:
                    address_array.append(ip_to_binary(address))
                else:
                    for ip in IPNetwork(address):
                        address_array.append(ip_to_binary(str(ip)))
        sub_query11 = {
            'destinationipv4address': {'$in': address_array}
        }

        sub_query21 = {
            'sourceipv4address': {'$in': address_array}
        }

        address_array = []
        if len(str(user.mac_addresses).strip()) != 0 and user.mac_addresses is not None:
            addressList = re.split(';', user.mac_addresses)
            for address in addressList:
                    address_array.append(mac_to_binary(address))
        sub_query12 = {
            'destinationmacaddress': {'$in': address_array}
        }

        sub_query22 = {
            'sourcemacaddress': {'$in': address_array}
        }

        """
        if sub_query11 is None:
            query1['$and'] = [{'datetime': {'$gte': time_from}}, {'datetime': {'$lt': time_to}}, sub_query12]
        elif sub_query12 is None:
            query1['$and'] = [{'datetime': {'$gte': time_from}}, {'datetime': {'$lt': time_to}}, sub_query11]
        else:
            query1['$or'] = [sub_query11, sub_query12]
            query1['$and'] = [{'datetime': {'$gte': time_from}}, {'datetime': {'$lt': time_to}}]

        if sub_query21 is None:
            query2['$and'] = [{'datetime': {'$gte': time_from}}, {'datetime': {'$lt': time_to}}, sub_query22]
        elif sub_query22 is None:
            query2['$and'] = [{'datetime': {'$gte': time_from}}, {'datetime': {'$lt': time_to}}, sub_query21]
        else:
            query2['$or'] = [sub_query21, sub_query22]
            query2['$and'] = query1['$and']
        """
        query1['$or'] = [sub_query11, sub_query12]
        # query1['$or'] = [sub_query11]
        query1['$and'] = [{'datetime': {'$gte': time_from}}, {'datetime': {'$lt': time_to}}]
        # query2['$or'] = [sub_query21]
        query2['$or'] = [sub_query21, sub_query22]
        query2['$and'] = query1['$and']

        records1 = records.find(query1, projection)
        records2 = records.find(query2, projection)
        octetsin = 0L
        octetsout = 0L

        for rec in records1:
            octetsin += rec['octetdeltacount']

        for rec in records2:
            octetsout += rec['octetdeltacount']

        downloadData.append(['ID ' + str(user.id), octetsin])
        uploadData.append(['ID ' + str(user.id), octetsout])


    downData = {
        'data': downloadData,
        'label': 'Downloaded/Input data'
    },
    upData = {
        'data': uploadData,
        'label': 'Uploaded/Output data'
    }

    data = {
        'downData': downData[0],
        'upData': upData,
        'time_from': time_from_string,
        'time_to': time_to_string
    }
    connection.close_connection()
    return data