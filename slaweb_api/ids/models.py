# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import collections
from django.conf import settings
from jsonfield import JSONField
from django.db import models
from core.models import Client
from pilkit.processors import ResizeToFill
from imagekit.models import ProcessedImageField


class IdsUser(models.Model):
    name = models.CharField(max_length=200, blank=True)
    query = JSONField(blank=True, load_kwargs={'object_pairs_hook': collections.OrderedDict})
    module_name = models.CharField(max_length=200, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    section_name = models.CharField(max_length=100, blank=True)
    last = models.BooleanField(default=False)


class AttackLogs(models.Model):
    attacktype = models.TextField()
    starttime = models.DateTimeField()
    endtime = models.DateTimeField()
    destip = models.CharField(max_length=20)
    srcip = models.CharField(max_length=20, null=True)
    destport = models.IntegerField(null=True)
    ps_flowcount = models.IntegerField(null=True)
    sf_syncount = models.IntegerField(null=True)
    uf_packetcount = models.IntegerField(null=True)
    rf_rstcount = models.IntegerField(null=True)
    tf_ttlcount = models.IntegerField(null=True)
    ff_fincount = models.IntegerField(null=True)
    probability = models.IntegerField(null=True)


class AttackDetails(models.Model):
    attack = models.ForeignKey(AttackLogs)
    since = models.DateTimeField()
    till = models.DateTimeField()
    probability = models.IntegerField(null=True)
    sf_syncount = models.IntegerField(null=True)
    uf_packetcount = models.IntegerField(null=True)
    rf_rstcount = models.IntegerField(null=True)
    tf_ttlcount = models.IntegerField(null=True)
    ff_fincount = models.IntegerField(null=True)

# class AttackDetails(models.Model):
#     attack = models.OneToOneField(AttackLogs, primary_key=True)
#     since = models.DateTimeField()
#     till = models.DateTimeField()
#     probability = models.FloatField()
#     sf_syncount = models.IntegerField(null=True)
#     uf_packetcount = models.IntegerField(null=True)
#     rf_rstcount = models.IntegerField(null=True)
#     tf_ttlcount = models.IntegerField(null=True)
#     ff_fincount = models.IntegerField(null=True)