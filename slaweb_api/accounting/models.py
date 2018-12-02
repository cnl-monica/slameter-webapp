# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import collections
from django.conf import settings
from jsonfield import JSONField
from django.db import models
from core.models import Client
from pilkit.processors import ResizeToFill
from imagekit.models import ProcessedImageField
from jsonfield import JSONField


class AccUser(Client):

    organization = models.CharField(max_length=64)
    address_street_name = models.CharField(max_length=128, null=True, blank=True)
    address_street_number = models.CharField(max_length=12, null=True, blank=True)
    address_zip_code = models.CharField(max_length=15, null=True, blank=True)
    address_city = models.CharField(max_length=64, null=True, blank=True)
    address_country = models.CharField(max_length=64, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    mobile = models.CharField(max_length=20, null=True, blank=True)
    ip_addresses = models.CharField(max_length=256, null=True, blank=True)
    mac_addresses = models.CharField(max_length=512, null=True, blank=True)
    ico = models.CharField(max_length=16, null=True, blank=True)
    dic = models.CharField(max_length=16, null=True, blank=True)
    accountNo = models.CharField(max_length=16, null=True, blank=True)


class AccCriteria(models.Model):


    PROTOCOL_CHOICES = (
        ('117', 'ATP'),
        ('33', 'DCCP'),
        ('133', 'FC'),
        ('40', 'IL'),
        ('132', 'SCTP'),
        ('1', 'ICMP'),
        ('2', 'IGMP'),
        ('6', 'TCP'),
        ('17', 'UDP'),
        ('136', 'UDPLite'),
        ('137', 'MPLS-in-IP'),
        ('8', 'EGP'),
        ('9', 'IGP'),
        ('47', 'GRE'),
        ('51', 'AH'),
        ('55', 'MOBILE'),
        ('56', 'TLSP'),
        ('70', 'VISA'),
        ('84', 'TTP'),
        ('88', 'EIGRP'),
        ('any', 'ANY'),
    )


    user = models.ForeignKey(AccUser, null=True, blank=True)
    sourceIpAddresses = models.CharField(max_length=256, null=True, blank=True)
    destinationIpAddresses = models.CharField(max_length=256, null=True, blank=True)
    protocol = models.CharField(max_length=3, null=True, blank=True, choices=PROTOCOL_CHOICES)
    sourcePorts = models.CharField(max_length=128, null=True, blank=True)
    destinationPorts = models.CharField(max_length=128, null=True, blank=True)
    dscp = models.CharField(max_length=16, null=True, blank=True)
    multicast = models.BooleanField()
    rate_sh = models.FloatField()
    rate_wh = models.FloatField()
    rate_sh_data = models.DecimalField(max_digits=19, decimal_places=6)
    rate_wh_data = models.DecimalField(max_digits=19, decimal_places=6)
    priority = models.IntegerField()

    def __unicode__(self):
        return 'Criterium ' + str(self.id) + ' for accounting User ' + str(self.user.name) + ' with accUser id ' + str(self.user.id)
    # Singleton model, one row table for provider accounting&accounting basic information


class AccProvider(models.Model):

    # photo = ProcessedImageField(upload_to='accounting/uploaded_files/', processors=[ResizeToFill(190, 85)], format='JPEG', options={'quality': 60}, blank=True, null=True)
    name = models.CharField(max_length=64)
    address_street_name = models.CharField(max_length=128)
    address_street_number = models.CharField(max_length=12)
    address_zip_code = models.CharField(max_length=15)
    address_city = models.CharField(max_length=64)
    address_country = models.CharField(max_length=64)
    contact_number = models.CharField(max_length=20)
    email = models.EmailField()
    ico = models.CharField(max_length=16)
    dic = models.CharField(max_length=16)
    accountNo = models.CharField(max_length=16)
    tax = models.CharField(max_length=2)

    def save(self, *args, **kwargs):
        self.__class__.objects.exclude(id=self.id).delete()
        super(AccProvider, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        try:
            return cls.objects.get()
        except cls.DoesNotExist:
            return cls()


class BillPlans(models.Model):

    PERIOD_CHOICES = (
        ('1', 'monthly'),
        ('3', 'quarterly')
    )

    MONTHS_CHOICES = (
        ('1,4,7,10', 'Jan, Apr, July, Oct'),
        ('2,5,8,11', 'Feb, May, Aug, Nov'),
        ('3,6,9,12', 'Mar, June, Sept, Dec')
    )

    name = models.CharField(max_length=64)
    description = models.TextField(null=True, blank=True)
    billing_type = models.CharField(max_length=8)
    calculation_type = models.CharField(max_length=20, null=True, blank=True)
    user = models.ForeignKey(AccUser)
    base_amount = models.DecimalField(max_digits=18, decimal_places=0, null=True, blank=True)
    additional_amount = models.DecimalField(max_digits=18, decimal_places=0, null=True, blank=True)
    base_tariff = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    additional_tariff = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    double_tt_criteria = models.NullBooleanField()
    hour_from_criteria = models.CharField(max_length=2, null=True, blank=True)
    hour_to_criteria = models.CharField(max_length=2, null=True, blank=True)
    generation_date = models.DecimalField(max_digits=2, decimal_places=0)
    period = models.CharField(max_length=1, choices=PERIOD_CHOICES)
    months = models.CharField(max_length=16, choices=MONTHS_CHOICES, null=True, blank=True)
    mail_address = models.CharField(max_length=50, null=True, blank=True)
    mail_subject = models.CharField(max_length=50, null=True, blank=True)

    def __unicode__(self):
            return 'Bill plan: ' + str(self.name) + ' for Accounting Entity ' + str(self.user.name)


class BillPlansReports(models.Model):
    plan = models.ForeignKey(BillPlans)
    plan_name = models.CharField(max_length=64)
    user = models.ForeignKey(AccUser)
    user_short_desc = models.CharField(max_length=32, null=True, blank=True)
    exec_time = models.CharField(max_length=19)
    exec_time_epoch = models.DecimalField(max_digits=16, decimal_places=0)
    evaluated_data = JSONField(blank=True)
    success = models.BooleanField()
    errmsg = models.CharField(max_length=128, null=True, blank=True)
