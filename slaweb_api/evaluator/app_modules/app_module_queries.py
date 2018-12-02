from __future__ import absolute_import
from applications.models import Ports, Dscp, TransportProtocols
from evaluator.mongo_client import MongoConnection
from evaluator.app_modules.mongo_tools import get_download, get_rec_by_label
import re
from math import floor


def apps_by_ports(download_match_query, upload_match_query, lm, group):
    download_group = {
        "$group": {
            "_id": "$sourceport"
            ,
            "octets": {
                "$sum": "$octetdeltacount"
            }
        }
    }
    upload_group = {
        "$group": {
            "_id": "$destinationport"
            ,
            "octets": {
                "$sum": "$octetdeltacount"
            }
        }
    }
    temp_dict = {}
    temp_dict_2 = {}
    total_download = total_upload = total_sum = 0
    project_download = {"$project": {"_id": 0, "label": '$_id', "download": "$octets"}}
    project_upload = {"$project": {"_id": 0, "label": '$_id', "upload": "$octets"}}
    db_connection = MongoConnection()
    db = db_connection.get_def_database()
    acc_records = db.acc_records
    download_raw_data = acc_records.aggregate([download_match_query, download_group, project_download])
    upload_raw_data = acc_records.aggregate([upload_match_query, upload_group, project_upload])
    if len(download_raw_data['result']) == 0 and len(upload_raw_data['result']) == 0:
        return {
            'error': True,
            'message': 'No data in database for this input parameters(Client, Time interval) !',
            'data': {
                'graph': [],
                'time_from': lm['from_str'],
                'time_to': lm['to_str']
            }
        }

    if len(download_raw_data['result']) != 0:
        for record in download_raw_data['result']:
            temp_dict[record['label']] = record['download']
    if len(upload_raw_data['result']) != 0:
        for record in upload_raw_data['result']:
            label = record['label']
            download = get_download(temp_dict, label)
            upload = record['upload']
            octet_sum = download + upload
            temp_dict_2[label] = [octet_sum, download, upload]
            total_download += download
            total_upload += upload
            total_sum += octet_sum

    ports_records = Ports.objects.all()
    response_list = []
    known_ports_upload = known_ports_download = 0
    for port_record in ports_records:
        ports = map(int, re.split(';', str(port_record.ports)))
        record_sum = download_rec = upload_rec = 0
        for port in ports:
            record_from_db = get_rec_by_label(temp_dict_2, port)
            record_sum += record_from_db[0]
            download_rec += record_from_db[1]
            upload_rec += record_from_db[2]
        response_list.append({
            "data": record_sum,
            "label": port_record.name,
            "upload": upload_rec,
            "download": download_rec
        })
        known_ports_download += download_rec
        known_ports_upload += upload_rec
    response_list.append({'data': (total_download+total_upload) - (known_ports_download+known_ports_upload), 'label': 'Other', 'download': total_download-known_ports_download,
                          'upload': total_upload-known_ports_upload})
    response_list.sort(reverse=True)
    graph = []
    for item in response_list:
        ab = floor(100 * 100 * float(item['data'])/float(total_sum)) / 100
        if ab > 0.009:
            item['procent'] = ab
            graph.append(item)

    if len(graph) > 15:
        for c in range(15, len(graph)):
            if graph[c]['procent'] < 1:
                graph = graph[0:c]
                break

    return {
        'graph': graph,
        'time_from': lm['from_str'],
        'time_to': lm['to_str']
    }


def apps_by_dscp(download_match_query, upload_match_query, lm, group):
    if group is None:
        group = {
            "$group": {
                "_id": "$ipdiffservcodepoint"
                ,
                "octets": {
                    "$sum": "$octetdeltacount"
                }
            }
        }
        records = apps_by_dpi(download_match_query, upload_match_query, lm, group)
        if 'error' in records:
            return records
        for record in records['graph']:
            if len(Dscp.objects.filter(dscp_class=record['label'])) > 0:
                record['label'] = Dscp.objects.get(dscp_class=record['label']).label
            else:
                record['label'] = "Unknown decimal value - " + str(record['label'])
        return records


def apps_by_protocol(download_match_query, upload_match_query, lm, group):
    if group is None:
        group = {
            "$group": {
                "_id": "$protocolidentifier"
                ,
                "octets": {
                    "$sum": "$octetdeltacount"
                }
            }
        }
        records = apps_by_dpi(download_match_query, upload_match_query, lm, group)
        if 'error' in records:
            return records
        other_sum = other_down = other_up = 0
        output_records = []
        for record in records['graph']:
            try:
                record['label'] = TransportProtocols.objects.get(protocol=record['label']).label
                output_records.append(record)
            except Exception:
                other_sum += record['data']
                other_down += record['download']
                other_up += record['upload']
        if other_sum != 0:
            output_records.append({
                "data": other_sum,
                "label": "Other",
                "upload": other_up,
                "download": other_down
            })

        return {
            'graph': output_records,
            'time_from': lm['from_str'],
            'time_to': lm['to_str']
        }


def apps_by_dpi(download_match_query, upload_match_query, lm, group):
    if group is None:
        group = {
            "$group": {
                "_id": "$applicationName"
                ,
                "octets": {
                    "$sum": "$octetdeltacount"
                }
            }
        }
    temp_dict = {}
    response_list = []
    total_sum = 0
    project_download = {"$project": {"_id": 0, "label": '$_id', "download": "$octets"}}
    project_upload = {"$project": {"_id": 0, "label": '$_id', "upload": "$octets"}}
    db_connection = MongoConnection()
    db = db_connection.get_def_database()
    acc_records = db.acc_records
    # Download line in  graph
    download_raw_data = acc_records.aggregate([download_match_query, group, project_download])
    upload_raw_data = acc_records.aggregate([upload_match_query, group, project_upload])
    if len(download_raw_data['result']) == 0 and len(upload_raw_data['result']) == 0:
        return {
            'error': True,
            'message': 'No data in database for this input parameters (Client, Time interval) !',
            'data': {
                'graph': [],
                'time_from': lm['from_str'],
                'time_to': lm['to_str']
            }
        }

    if len(download_raw_data['result']) != 0:
        for record in download_raw_data['result']:
            temp_dict[record['label']] = record['download']
    if len(upload_raw_data['result']) != 0:
        for record in upload_raw_data['result']:
            label = record['label']
            download = get_download(temp_dict, label)
            upload = record['upload']
            octet_sum = download + upload
            response_list.append({
                "data": octet_sum,
                "label": label,
                "upload": upload,
                "download": download
            })
            total_sum += octet_sum

    response_list.sort(reverse=True)
    graph = []

    for item in response_list:
        ab = floor(100 * 100 * float(item['data'])/float(total_sum)) / 100
        if ab > 0.009:
            item['procent'] = ab
            graph.append(item)

    if len(graph) > 15:
        for c in range(15, len(graph)):
            if graph[c]['procent'] < 1:
                graph = graph[0:c]
                break

    return {
        'graph': graph,
        'time_from': lm['from_str'],
        'time_to': lm['to_str']
    }