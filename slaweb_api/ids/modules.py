# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from . import ids
from core.framework.base import AbstractModule
from core.framework.serializers import BaseModuleSerializer


from ids.serializers import BaseIdsSerializer
from netstat.base import EvaluatorModule

#from ids.base import IdsModule


# class DefaultIdsModule(IdsModule):
class DefaultIdsModule(EvaluatorModule):
    """
    Default ids module
    """


# Wall modules -------------

#******** Monitoring START ********************************
@ids.module
class IdsSynFloodAttack(DefaultIdsModule):
    title = 'SYN Flood ATTACK'
    remote_name = 'IdsSynFloodAttack'

@ids.module
class IdsSynFloodAttackProbability(DefaultIdsModule):
    title = 'SYN Flood Attack PROBABILITY'
    remote_name = 'IdsSynFloodAttackProbability'



@ids.module
class IdsUdpFloodAttack(DefaultIdsModule):
    title = 'UDP Flood ATTACK'
    remote_name = 'IdsUdpFloodAttack'

@ids.module
class IdsUdpFloodAttackProbability(DefaultIdsModule):
    title = 'UDP Flood Attack PROBABILITY'
    remote_name = 'IdsUdpFloodAttackProbability'



@ids.module
class IdsPortScanAttack(DefaultIdsModule):
    title = 'PORT Scan  ATTACK'
    remote_name = 'IdsPortScanAttack'

@ids.module
class IdsPortScanAttackProbability(DefaultIdsModule):
    title = 'PORT Scan Attack PROBABILITY'
    remote_name = 'IdsPortScanAttackProbability'



@ids.module
class IdsRstFloodAttack(DefaultIdsModule):
    title = 'RST Flood ATTACK'
    remote_name = 'IdsRstFloodAttack'

@ids.module
class IdsRstFloodAttackProbability(DefaultIdsModule):
    title = 'RST Flood Attack PROBABILITY'
    remote_name = 'IdsRstFloodAttackProbability'



@ids.module
class IdsTtlFloodAttack(DefaultIdsModule):
    title = 'TTL Flood ATTACK'
    remote_name = 'IdsTtlFloodAttack'

@ids.module
class IdsTtlFloodAttackProbability(DefaultIdsModule):
    title = 'TTL Flood Attack PROBABILITY'
    remote_name = 'IdsTtlFloodAttackProbability'



@ids.module
class IdsFinFloodAttack(DefaultIdsModule):
    title = 'FIN Flood ATTACK'
    remote_name = 'IdsFinFloodAttack'

@ids.module
class IdsFinFloodAttackProbability(DefaultIdsModule):
    title = 'FIN Flood Attack PROBABILITY'
    remote_name = 'IdsFinFloodAttackProbability'
#******** Monitoring END ********************************


@ids.module
class AttackLogs(DefaultIdsModule):
    title = 'Attack logs'
    remote_name = 'AttackLogs'


# Navigation modules ----------

@ids.module
class IdsSynNavigation(DefaultIdsModule):
    title = 'SYN flood attack'
    remote_name = 'IdsSynNavigation'

@ids.module
class IdsUdpNavigation(DefaultIdsModule):
    title = 'UDP flood attack'
    remote_name = 'IdsUdpNavigation'

@ids.module
class IdsPortNavigation(DefaultIdsModule):
    title = 'Port scan attack'
    remote_name = 'IdsPortNavigation'

@ids.module
class IdsRstNavigation(DefaultIdsModule):
    title = 'RST flood attack'
    remote_name = 'IdsRstNavigation'

@ids.module
class IdsTtlNavigation(DefaultIdsModule):
    title = 'TTL flood attack'
    remote_name = 'IdsTtlNavigation'

@ids.module
class IdsFinNavigation(DefaultIdsModule):
    title = 'FIN flood attack'
    remote_name = 'IdsFinNavigation'


# @ids.module
# class MyModule(AbstractModule):
#     title = 'My Module'
#
#     _serializer_class = BaseIdsSerializer
#
#     def get_data(self, query=None):
#         pass