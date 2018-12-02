import re
from netaddr import *
from conversion_tools import ip_to_binary, get_time_intervals_for_mongo
from evaluator.mongo_client import MongoConnection
from accounting.models import AccCriteria


def evaluate_criteria(user_id, criteria, interval, time_tariff, tt):
    query = {}
    # Vybrat vsetky zaznamy ktore potrebujeme na zaklade IP adries a casu
    # Rozdielne pre 2tu a obycajnu cas. tarfifu
    # Prejst kazdy ziskany zaznam a urobit if-y  pre kazde kriterium
    source_address_array = []
    criteria_source_ip = {}
    destination_address_array = []
    criteria_destination_ip = {}
    criteria_src_port = {}
    criteria_dst_port = {}
    criteria_dscp = {}
    criteria_sum = {}


    projection = {
        'sourceipv4address': 1,
        'destinationipv4address': 1,
        'protocolidentifier': 1,
        'sourceport': 1,
        'destinationport': 1,
        'ipdiffservcodepoint': 1,
        'ismulticast': 1,
        'octetdeltacount': 1
    }

    for record in criteria:
        temp_source_ip = []
        temp_destination_ip = []
        if len(str(record.sourceIpAddresses).strip()) != 0 and record.sourceIpAddresses is not None:
            source_ip_addresses = re.split(';', str(record.sourceIpAddresses))
            for address in source_ip_addresses:
                if "/" not in address:
                    adr = ip_to_binary(address)
                    source_address_array.append(adr)
                    temp_source_ip.append(adr)
                else:
                    for ip in IPNetwork(address):
                        adr = ip_to_binary(str(ip))
                        source_address_array.append(adr)
                        temp_source_ip.append(adr)
            criteria_source_ip[str(record.id)] = temp_source_ip
        if len(str(record.destinationIpAddresses).strip()) != 0 and record.destinationIpAddresses is not None:
            destination_ip_addresses = re.split(';', str(record.destinationIpAddresses))
            for address in destination_ip_addresses:
                if "/" not in address:
                    adr = ip_to_binary(address)
                    destination_address_array.append(adr)
                    temp_destination_ip.append(adr)
                else:
                    for ip in IPNetwork(address):
                        adr = ip_to_binary(str(ip))
                        destination_address_array.append(adr)
                        temp_destination_ip.append(adr)
            criteria_destination_ip[str(record.id)] = temp_destination_ip

        if len(str(record.sourcePorts).strip()) != 0 and record.sourcePorts is not None:
            source_ports_array = re.split(';', str(record.sourcePorts))
            source_ports_array_int = [int(numeric_string) for numeric_string in source_ports_array]
            criteria_src_port[str(record.id)] = source_ports_array_int

        if len(str(record.destinationPorts).strip()) != 0 and record.destinationPorts is not None:
            destination_ports_array = re.split(';', str(record.destinationPorts))
            destination_ports_array_int = [int(numeric_string) for numeric_string in destination_ports_array]
            criteria_dst_port[str(record.id)] = destination_ports_array_int

        if len(str(record.dscp).strip()) != 0 and record.dscp is not None:
            dscp_array = re.split(';', str(record.dscp))
            dscp_array_int = [int(numeric_string) for numeric_string in dscp_array]
            criteria_dscp[str(record.id)] = dscp_array_int

    # query['$or'] = [{'sourceipv4address': {'$in': source_address_array}}, {'destinationipv4address': {'$in': destination_address_array}}]
    address_or = [{'sourceipv4address': {'$in': source_address_array}}, {'destinationipv4address': {'$in': destination_address_array}}]
    if time_tariff is not None and tt is not None:
        # query['$or'] = get_time_intervals_for_mongo(interval, time_tariff, tt)
        time_or = get_time_intervals_for_mongo(interval, time_tariff, tt)
        query['$and'] = [{'$or': time_or}, {'$or': address_or}]
    else:
        # time_from and time_date must be in Timestamp in milliseconds: e.g. # 1416009600000
        query['$and'] = [{'datetime': {'$gte': long(interval.get("time_from"))}}, {'datetime': {'$lt': long(interval.get("time_to"))}}, {'$or': address_or}]

    connection = MongoConnection()
    db = connection.get_def_database()
    acc_records = db.acc_records
    records_st = acc_records.find(query, projection)
    for crit_record in criteria:
        criteria_sum[str(crit_record.id)] = 0L

    for data_record in records_st:
        for crit_record in criteria:
            id = str(crit_record.id)
            if id not in criteria_source_ip or data_record['sourceipv4address'] in criteria_source_ip[id]:
                if id not in criteria_destination_ip or data_record['destinationipv4address'] in criteria_destination_ip[id]:
                    if crit_record.protocol == 'any' or data_record['protocolidentifier'] == int(crit_record.protocol):
                        if id not in criteria_src_port or data_record['sourceport'] in criteria_src_port[id]:
                            if id not in criteria_dst_port or data_record['destinationport'] in criteria_dst_port[id]:
                                if id not in criteria_dscp or data_record['ipdiffservcodepoint'] in criteria_dscp[id]:
                                    if crit_record.multicast is False or data_record['ismulticast'] is True:
                                        criteria_sum[id] += data_record['octetdeltacount']
                                        break
    results = []
    for crit_record in criteria:
        results.append(['ID '+str(crit_record.id), float(criteria_sum[str(crit_record.id)])])

    connection.close_connection()
    return results


def get_bill_data_for_criteria(two_tariff, input_data):

    total_sum = 0
    output_data = [

    ]

    if two_tariff:

        for item in input_data[0]:
            dataList = re.split(' ', item[0])
            criterium = AccCriteria.objects.get(id=int(dataList[1]))
            #1024**3 pre G
            divided_data = round(item[1] / float(criterium.rate_sh_data), 3)
            output_data.append(
                {
                    "criterium_id": str(criterium.id),
                    "data_st_rate": item[1],
                    "divided_data_sh": divided_data,
                    "st_rate": criterium.rate_sh,
                    "st_rate_data_unit": criterium.rate_sh_data,
                    "data_wt_rate": '',
                    "wt_rate": ''
                }
            )

        i = 0
        for ef in input_data[1]:
            sum = 0
            tempList = re.split(' ', ef[0])
            criterium = AccCriteria.objects.get(id=int(tempList[1]))
            divided_data = round(ef[1] / float(criterium.rate_wh_data), 3)
            stData = float(output_data[i]['divided_data_sh']) * criterium.rate_sh
            wtData = divided_data * criterium.rate_wh
            sum = round(stData + wtData, 2)
            output_data[i]["divided_data_wh"] = divided_data
            output_data[i]["data_wt_rate"] = ef[1]
            output_data[i]["wt_rate"] = criterium.rate_wh
            output_data[i]["wt_rate_data_unit"] = criterium.rate_wh_data
            output_data[i]["sum"] = sum

            total_sum += sum
            i += 1

    else:
        for item in input_data[0]:
            sum = 0
            dataList = re.split(' ', item[0])
            criterium = AccCriteria.objects.get(id=int(dataList[1]))
            #1024**3 pre GB
            dataVolumeInGB = round(item[1] / float(criterium.rate_sh_data), 3)
            sum = round(dataVolumeInGB * criterium.rate_sh, 2)
            output_data.append(
                {
                    "criterium_id": str(criterium.id),
                    "data_st_rate": item[1],
                    "divided_data_sh": dataVolumeInGB,
                    "st_rate": criterium.rate_sh,
                    "st_rate_data_unit": criterium.rate_sh_data,
                    "sum": sum
                }
            )
            total_sum += sum

    billing_data = {
        "two_tariff": two_tariff,
        "data": output_data,
        "total_sum": round(total_sum, 2)
    }
    return billing_data