# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from accounting.models import AccUser, AccCriteria, AccProvider, BillPlans, BillPlansReports
from core.admin import ClientAdmin, UserAdmin
from django import forms
from core.admin import UserChangeForm, UserCreationForm
import re


class AccUserChangeForm(UserChangeForm):

    def clean_mac_addresses(self):
        mac_addresses_pattern = '^ *\\b(([A-F]|[0-9]){2}\\:){5}([A-F]|[0-9]){2}(\\;(([A-F]|[0-9]){2}\\:){5}([A-F]|[0-9]){2})*\\b$'
        mac_addresses = self.cleaned_data.get("mac_addresses")
        if self.cleaned_data.get("ip_addresses") is not None:
            if len(mac_addresses) == 0 and len(self.cleaned_data.get("ip_addresses")) == 0:
                msg = "You must use at least one type of address (IP or MAC) !"
                raise forms.ValidationError(msg)
            if len(mac_addresses) != 0 and re.match(mac_addresses_pattern, mac_addresses) is None:
                msg = "Bad format of MAC addresses list ! ex.: 24:FD:52:25:64:E7;33:66:52:25:22:FE"
                raise forms.ValidationError(msg)
        return mac_addresses

    def clean_ip_addresses(self):
        ip_addresses_pattern = '^ *\\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(/[8,9]|/1[0-9]|/2[0-9]|/3[0-2])?(;(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(/[8,9]|/1[0-9]|/2[0-9]|/3[0-2])?)*\\b$'
        ip_addresses = self.cleaned_data.get("ip_addresses")
        if len(ip_addresses) != 0 and re.match(ip_addresses_pattern, ip_addresses) is None:
            msg = "Bad format of IP addresses list ! ex.: 192.168.1.0/24;192.168.2.1"
            raise forms.ValidationError(msg)
        return ip_addresses


class AccUserCreationForm(UserCreationForm):

    clean_ip_addresses = AccUserChangeForm.__dict__['clean_ip_addresses']
    clean_mac_addresses = AccUserChangeForm.__dict__['clean_mac_addresses']


class AccUserAdmin(ClientAdmin):
    add_form = AccUserCreationForm
    form = AccUserChangeForm
    client_fields = ("Basic access", {"fields": ("email", "name", "password")})
    network_fields = ("Network Settings", {"fields": ("exporter", "ip_address", "ip_addresses", "mac_addresses")})
    accounting_fields = ("Accounting specific information", {"classes": ("wide",),
            "fields": ("organization", "address_street_name", "address_street_number",
                       "address_zip_code", "address_city", "address_country",
                       "phone", "mobile", "ico", "dic", "accountNo")
        })
    search_fields = ("name", "ip_address",)
    list_display = ("name", "ip_address")
    fieldsets = (
        client_fields,
        network_fields,
        UserAdmin.fieldsets[1],
        accounting_fields
    )
    add_fieldsets = (
        ("Basic access", {"fields": ("email", "name", "password1", "password2")}),
        network_fields,
        accounting_fields
    )


admin.site.register(AccUser, AccUserAdmin)
admin.site.register(BillPlansReports)
admin.site.register(AccCriteria)
admin.site.register(AccProvider)
admin.site.register(BillPlans)