# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django import forms
from django.contrib import admin
from applications.models import Ports, Dscp, TransportProtocols

import re


class PortsCreationForm(forms.ModelForm):
    name = forms.CharField(label="Name of protocol or application", widget=forms.TextInput(attrs={'size': 100}))
    ports = forms.CharField(label="Ports", widget=forms.TextInput(attrs={'size': 100}))

    class Meta:
        model = Ports

    def clean_ports(self):
        port_pattern = '^ *(\\d{1,5})(;\\d{1,5})*$'
        ports = self.cleaned_data.get("ports")
        if re.match(port_pattern, ports) is None:
            msg = "Insert ports separated by semicolon(;) !"
            raise forms.ValidationError(msg)
        return ports


class PortsAdmin(admin.ModelAdmin):
    form = PortsCreationForm

admin.site.register(Ports, PortsAdmin)
admin.site.register(Dscp)
admin.site.register(TransportProtocols)
