import re
import struct
import datetime
from netaddr import *
from bson.binary import Binary


def data_size_of(num, suffix='B'):
    for unit in ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z']:
        if abs(num) < 1024.0:
            return "%3.1f %s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f %s%s" % (num, 'Yi', suffix)


def data_per_sec_size_of(num, suffix='bps'):
    for unit in ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z']:
        if abs(num) < 1000.0:
            return "%3.1f %s%s" % (num, unit, suffix)
        num /= 1000.0
    return "%.1f %s%s" % (num, 'Yi', suffix)


def mac_to_binary(mac_address):
    byte_array = re.split(':', str(mac_address))
    mac_bytes = []
    for e in byte_array:
        mac_bytes.append(int(e, 16))
    packed = struct.pack('BBBBBB', *mac_bytes)
    return Binary(packed, 0)


def binary_to_mac(mac_address):
    return "%x:%x:%x:%x:%x:%x" % struct.unpack("BBBBBB", mac_address)


def ip_addresses_to_binary(ip_addresses_str):
    ip_address_array = []
    address_list = re.split(';', ip_addresses_str)
    for address in address_list:
        if address.__contains__('-'):
            address_second_list = re.split('-', address)
            range_addresses = list(iter_iprange(address_second_list[0], address_second_list[1]))
            for a in range_addresses:
                ip_address_array.append(ip_to_binary(a))
        else:
            ip_address_array.append(ip_to_binary(address))
    return ip_address_array


def ip_to_binary(ip_address):
    result = 0
    ip_address_in_array = re.split('\\.', str(ip_address))

    range = [3, 2, 1, 0]
    for x in range:
        ip = long(ip_address_in_array[x])
        result |= ip << (x * 8)

    h = struct.pack('I', result)
    bin_ip = Binary(h)
    return bin_ip


def last_month_interval():
    interval = {}

    today = datetime.date.today()
    today.strftime('%H:%M')
    firstDayInThisMonth = datetime.datetime(day=1, month=today.month, year=today.year, hour=23, minute=59, second=59)
    if firstDayInThisMonth.month != 1:
       lastMonthStart = datetime.datetime(day=1, month=(today.month-1), year=today.year, hour=0, minute=0, second=0)
    else:
       lastMonthStart = datetime.datetime(day=1, month=12, year=today.year-1, hour=0, minute=0, second=0)

    lastMonthEnd = firstDayInThisMonth - datetime.timedelta(days=1)

    interval['from_str'] = lastMonthStart.strftime("%d.%m.%Y 00:00:00")
    interval['to_str'] = lastMonthEnd.strftime("%d.%m.%Y 23:59:59")

    interval['from_utc_long'] = long(lastMonthStart.strftime("%s"))*1000
    interval['to_utc_long'] = long(lastMonthEnd.strftime("%s"))*1000
    return interval


def last_hour():
    interval = {}
    now = datetime.datetime.now()
    before_hour = now - datetime.timedelta(hours=1)
    interval['from_str'] = before_hour.strftime("%d.%m.%Y %H:%M:%S")
    interval['to_str'] = now.strftime("%d.%m.%Y %H:%M:%S")
    interval['from_utc_long'] = long(before_hour.strftime("%s"))*1000
    interval['to_utc_long'] = long(now.strftime("%s"))*1000
    return interval


def last_day():
    interval = {}

    now = datetime.datetime.now()
    yesterday = now - datetime.timedelta(days=1)
    last_day_start = datetime.datetime(day=yesterday.day, month=yesterday.month, year=yesterday.year, hour=0, minute=0, second=0)
    last_day_end = datetime.datetime(day=yesterday.day, month=yesterday.month, year=yesterday.year, hour=23, minute=59, second=59)
    interval['from_str'] = last_day_start.strftime("%d.%m.%Y %H:%M:%S")
    interval['to_str'] = last_day_end.strftime("%d.%m.%Y %H:%M:%S")

    interval['from_utc_long'] = long(last_day_start.strftime("%s"))*1000
    interval['to_utc_long'] = long(last_day_end.strftime("%s"))*1000
    return interval


def today():
    interval = {}
    now = datetime.datetime.now()
    today_start = datetime.datetime(day=now.day, month=now.month, year=now.year, hour=0, minute=0, second=0)
    today_end = datetime.datetime(day=now.day, month=now.month, year=now.year, hour=23, minute=59, second=59)
    interval['from_str'] = today_start.strftime("%d.%m.%Y %H:%M:%S")
    interval['to_str'] = today_end.strftime("%d.%m.%Y %H:%M:%S")

    interval['from_utc_long'] = long(today_start.strftime("%s"))*1000
    interval['to_utc_long'] = long(today_end.strftime("%s"))*1000
    return interval


def last_three_month_interval():
    interval = {}

    today = datetime.date.today()
    today.strftime('%H:%M')
    firstDayInThisMonth = datetime.datetime(day=1, month=today.month, year=today.year, hour=23, minute=59, second=59)
    if firstDayInThisMonth.month not in [1, 2, 3]:
       lastMonthStart = datetime.datetime(day=1, month=(today.month-3), year=today.year, hour=0, minute=0, second=0)
    else:
       lastMonthStart = datetime.datetime(day=1, month=12-(3-today.month), year=today.year-1, hour=0, minute=0, second=0)

    lastMonthEnd = firstDayInThisMonth - datetime.timedelta(days=1)

    interval['from_str'] = lastMonthStart.strftime("%d.%m.%Y 00:00:00")
    interval['to_str'] = lastMonthEnd.strftime("%d.%m.%Y 23:59:59")

    interval['from_utc_long'] = long(lastMonthStart.strftime("%s"))*1000
    interval['to_utc_long'] = long(lastMonthEnd.strftime("%s"))*1000
    return interval


def relative_hours(hours):
    hours = int(hours)
    interval = {}
    now = datetime.datetime.now()
    before_hours = now - datetime.timedelta(hours=hours)
    interval['from_str'] = before_hours.strftime("%d.%m.%Y %H:%M:%S")
    interval['to_str'] = now.strftime("%d.%m.%Y %H:%M:%S")
    interval['from_utc_long'] = long(before_hours.strftime("%s"))*1000
    interval['to_utc_long'] = long(now.strftime("%s"))*1000
    return interval


def relative_days(days):
    days = int(days)
    interval = {}
    now = datetime.datetime.now()
    first_day_in_interval = now - datetime.timedelta(days=days)
    yesterday = now - datetime.timedelta(days=1)
    last_day_start = datetime.datetime(day=first_day_in_interval.day, month=first_day_in_interval.month, year=first_day_in_interval.year, hour=0, minute=0, second=0)
    last_day_end = datetime.datetime(day=yesterday.day, month=yesterday.month, year=yesterday.year, hour=23, minute=59, second=59)
    interval['from_str'] = last_day_start.strftime("%d.%m.%Y %H:%M:%S")
    interval['to_str'] = last_day_end.strftime("%d.%m.%Y %H:%M:%S")
    interval['from_utc_long'] = long(last_day_start.strftime("%s"))*1000
    interval['to_utc_long'] = long(last_day_end.strftime("%s"))*1000
    return interval


def relative_months(months):
    months = int(months)
    months_array = []
    for x in range(1, months+1):
        months_array.append(x)

    interval = {}

    today = datetime.date.today()
    today.strftime('%H:%M')
    firstDayInThisMonth = datetime.datetime(day=1, month=today.month, year=today.year, hour=23, minute=59, second=59)
    if firstDayInThisMonth.month not in months_array:
       lastMonthStart = datetime.datetime(day=1, month=(today.month-months), year=today.year, hour=0, minute=0, second=0)
    else:
       lastMonthStart = datetime.datetime(day=1, month=12-(months-today.month), year=today.year-1, hour=0, minute=0, second=0)

    lastMonthEnd = firstDayInThisMonth - datetime.timedelta(days=1)

    interval['from_str'] = lastMonthStart.strftime("%d.%m.%Y 00:00:00")
    interval['to_str'] = lastMonthEnd.strftime("%d.%m.%Y 23:59:59")
    interval['from_utc_long'] = long(lastMonthStart.strftime("%s"))*1000
    interval['to_utc_long'] = long(lastMonthEnd.strftime("%s"))*1000
    return interval


def utc_to_string(timestamp):
    timestamp = datetime.datetime.fromtimestamp(float(timestamp)/1000.0)
    return timestamp.strftime("%d.%m.%Y %H:%M:%S")


def get_time_intervals_for_mongo(interval, time_tariff, tt):
    # dicto = [{'datetime': {'$gte': long(1415836800000)}}, {'datetime': {'$lt': long(1415923200000)}}]
    # dicti = [{'datetime': {'$gte': long(1415923200000)}}, {'datetime': {'$lt': long(1416009600000)}}]
    # dict = [ {'$and':dicto}, {'$and':dicti ]
    result_array = []
    int_from = long(interval.get("time_from")/1000.0)
    int_to = long(interval.get("time_to")/1000.0)
    interval_num = (int_to - int_from) / 86400 + 1

    interval_from_raw = datetime.datetime.fromtimestamp(int_from)
    # interval_to_raw = datetime.datetime.fromtimestamp(int_to)
    if tt is True:
            interval_from_raw = datetime.datetime(
                day=interval_from_raw.day, month=interval_from_raw.month,
                year=interval_from_raw.year, hour=int(time_tariff.get("hour_from")),
                minute=0)
            fst_interval_time_from = long(interval_from_raw.strftime('%s'))
            if int(time_tariff.get("hour_to")) > int(time_tariff.get("hour_from")):
                interval_to_raw = datetime.datetime(
                    day=interval_from_raw.day, month=interval_from_raw.month,
                    year=interval_from_raw.year, hour=int(time_tariff.get("hour_to")),
                    minute=0)
                fst_interval_time_to = long(interval_to_raw.strftime('%s'))
            else:
                rest_hours = 24 - (int(time_tariff.get("hour_from")) - int(time_tariff.get("hour_to")))
                fst_interval_time_to = fst_interval_time_from + rest_hours*3600

    else:
        interval_from_raw = datetime.datetime(
            day=interval_from_raw.day, month=interval_from_raw.month,
            year=interval_from_raw.year, hour=int(time_tariff.get("hour_to")),
            minute=0)
        if int(time_tariff.get("hour_to")) > int(time_tariff.get("hour_from")):
            rest_hours = 24 - (int(time_tariff.get("hour_to")) - int(time_tariff.get("hour_from")))
        else:
            rest_hours = (int(time_tariff.get("hour_from"))-int(time_tariff.get("hour_to")))
        fst_interval_time_from = long(interval_from_raw.strftime('%s'))
        fst_interval_time_to = fst_interval_time_from + rest_hours*3600
        # cast dna ktora bola vynechana a ST zacina po 00:00
        missed_interval_from_raw = datetime.datetime.fromtimestamp(int_from)
        missed_interval_from_raw = datetime.datetime(
                day=missed_interval_from_raw.day, month=missed_interval_from_raw.month,
                year=missed_interval_from_raw.year, hour=int(time_tariff.get("hour_from")),
                minute=0)
        missed_fst_interval_time_from = long(missed_interval_from_raw.strftime('%s'))
        if int_from < missed_fst_interval_time_from:
            tmp_dct = [{'datetime': {'$gte': long(int_from*1000)}}, {'datetime': {'$lt': long(missed_fst_interval_time_from*1000)}}]
            result_array.append({'$and': tmp_dct})
    if not(int_from > fst_interval_time_from and int_from > fst_interval_time_to) and int_to > fst_interval_time_to:
        if int_from <= fst_interval_time_from:
            dict_1st_inter = [{'datetime': {'$gte': long(fst_interval_time_from*1000)}}, {'datetime': {'$lt': long(fst_interval_time_to*1000)}}]
        else:
            dict_1st_inter = [{'datetime': {'$gte': long(int_from*1000)}}, {'datetime': {'$lt': long(fst_interval_time_to*1000)}}]
        result_array.append({'$and': dict_1st_inter})

    for i in range(1, interval_num-1):
        dict_1st_inter = [{'datetime': {'$gte': long((fst_interval_time_from+(i*86400))*1000)}}, {'datetime': {'$lt': long((fst_interval_time_to+(i*86400))*1000)}}]
        result_array.append({'$and': dict_1st_inter})

    bef_last_int_start = fst_interval_time_from + (86400*(interval_num-1))
    bef_last_int_end = fst_interval_time_to + (86400*(interval_num-1))

    last_int_start = fst_interval_time_from + (86400*interval_num)
    last_int_end = fst_interval_time_to + (86400*interval_num)

    if not(int_to < bef_last_int_start and int_to < bef_last_int_end):
        if int_to >= bef_last_int_end:
            dict_bef_last_inter = [{'datetime': {'$gte': long(bef_last_int_start*1000.0)}}, {'datetime': {'$lt': long(bef_last_int_end*1000.0)}}]
        else:
            dict_bef_last_inter = [{'datetime': {'$gte': long(bef_last_int_start*1000.0)}}, {'datetime': {'$lt': long(int_to*1000.0)}}]
        result_array.append({'$and': dict_bef_last_inter})

    if not(int_to < last_int_start and int_to < last_int_end):
        if int_to >= last_int_end:
            dict_last_inter = [{'datetime': {'$gte': long(last_int_start*1000.0)}}, {'datetime': {'$lt': long(last_int_end*1000.0)}}]
        else:
            dict_last_inter = [{'datetime': {'$gte': long(last_int_start*1000.0)}}, {'datetime': {'$lt': long(int_to*1000.0)}}]
        result_array.append({'$and': dict_last_inter})


    return result_array