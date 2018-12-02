# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from datetime import timedelta
import time

from .base import AbstractFilterProcessor, FilterMeta


class ExporterFilter(AbstractFilterProcessor):
    template = {
        'exporter_id': FilterMeta(required=True)
    }


class TimeFilter(AbstractFilterProcessor):
    template = {
        'time': FilterMeta(default=[-int(timedelta(minutes=30).total_seconds())*1000, 0])
    }

    def process_time(self, input, field_name=None, query=None):

        input_time = input['time']

        int_or_long = lambda num: isinstance(num, int) or isinstance(num, long)

        valid_input = lambda: input_time is not None and len(input_time) == 2 and \
                              int_or_long(input_time[0]) and int_or_long(input_time[1])

        if valid_input():
            start, end = input_time[0], input_time[1]
            if start < 0 and end < 1:
                now = int(time.time()*1000)
                input_time = [now+start, now+end]

        res = {
            'time': input_time if valid_input() else None
        }
        return res


class IpFilter(AbstractFilterProcessor):
    template = {
        'ips': {
            'META': FilterMeta(flatten=True),
            'source_ip': FilterMeta(),
            'destination_ip': FilterMeta(),
            'host_ip': FilterMeta()
        }
    }

    def process_ips_host_ip(self, input, *args):
        """
        Bit of a customization, as interface not yet support 2 sets of values
        for host_ip

        :param input: input field
        :param args: additional, not used parameters send from processor
        :return: processed value
        """
        host_ip = input.get('host_ip', None)

        if not host_ip:
            return input

        return {
            'host_ip': [input['host_ip']]
        }


class ClientFilter(AbstractFilterProcessor):
    template = {
        'client_ip': FilterMeta()
    }


class PortFilter(AbstractFilterProcessor):
    template = {
        'ports': {
            'META': FilterMeta(flatten=True),
            'source_port': FilterMeta(),
            'destination_port': FilterMeta(),
            'host_port': FilterMeta()
        }
    }

    def process_ports_host_port(self, input, *args):
        """
        Bit of a customization, as interface not yet support 2 sets of values
        for host_port

        :param input: input field
        :param args: additional, not used parameters send from processor
        :return: processed value
        """
        host_port = input['host_port']

        if not host_port:
            return input

        return {
            'host_port': [input['host_port']]
        }


