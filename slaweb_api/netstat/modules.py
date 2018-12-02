# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from . import netstat
from . import filters
from .base import EvaluatorModule


class DefaultNetstatModule(EvaluatorModule):
    """
    Module with filter processors and filter setup for clients
    """
    _default_filter_processor_classes = (filters.ExporterFilter,
                                         filters.TimeFilter,
                                         filters.IpFilter,
                                         filters.PortFilter,
                                         filters.ClientFilter)

    def auto_client_setup(self):
        # for clients, set exporter and client_ip as they have
        # access only to those assigned to them
        if self.user.is_client:
            self._query.query['exporter_id'] = self.user.to_client().exporter.exporter_id
            self._query.query['client_ip'] = self.user.to_client().ip_address

    def set_query(self, filter_query, section_name):
        super(DefaultNetstatModule, self).set_query(filter_query, section_name)
        self.auto_client_setup()


# Wall modules -------------

@netstat.module
class BandwidthHistory(DefaultNetstatModule):
    title = 'Bandwidth History'
    remote_name = 'BandwidthHistoryTrend'

    evaluator_configuration = 'second'


@netstat.module
class BandwidthHistoryPackets(DefaultNetstatModule):
    title = 'Bandwidth History in Packets'
    remote_name = 'BandwidthHistoryTrendPacket'

    evaluator_configuration = 'second'


@netstat.module
class FlowHistory(DefaultNetstatModule):
    title = 'Flow History'
    remote_name = 'HistoryTrendFlows'


@netstat.module
class HistoryOverview(DefaultNetstatModule):
    title = 'History Overview'
    remote_name = 'HistoryTable'

    evaluator_configuration = 'second'


# Summary modules ----------

@netstat.module
class NumberOfFlows(DefaultNetstatModule):
    title = 'Number of Flows'
    remote_name = 'NumberOfFlows'


@netstat.module
class TransferredData(DefaultNetstatModule):
    title = 'Transferred Data'
    remote_name = 'AmountOfTransferredData'

    evaluator_configuration = 'second'


@netstat.module
class TransferredPackets(DefaultNetstatModule):
    title = 'Transferred Packets'
    remote_name = 'AmountOfTransferredDataPacket'


@netstat.module
class AverageDataSpeed(DefaultNetstatModule):
    title = 'Average Data Speed'
    remote_name = 'AverageDownloadUpload'


@netstat.module
class AveragePacketSpeed(DefaultNetstatModule):
    title = 'Average Packet Speed'
    remote_name = 'AverageDownloadUploadPacket'


@netstat.module
class MaximumSpeed(DefaultNetstatModule):
    title = 'Maximum Speed'
    remote_name = 'MaximumDownloadUpload'

    evaluator_configuration = 'second'


@netstat.module
class PingTime(DefaultNetstatModule):
    title = 'Ping Time'
    remote_name = 'PingTime'


@netstat.module
class ThroughputInBytes(EvaluatorModule):
    title = 'Throughput in Bytes'


@netstat.module
class ThroughputInPackets(EvaluatorModule):
    title = 'Throughput in Packets'


@netstat.module
class PacketlossInPackets(EvaluatorModule):
    title = 'PacketLoss in Packets'


@netstat.module
class PacketlossInBytes(EvaluatorModule):
    title = 'PacketLoss in Bytes'
