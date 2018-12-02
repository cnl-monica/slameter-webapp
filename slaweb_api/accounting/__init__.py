# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from .models import AccProvider
from core.framework.base import BaseApp

accounting = BaseApp(name="accounting", title="Accounting And Billing")


# !! import all python module files that contain accounting modules
# so they can be discovered


"""
Basic provider information for accounting initialization

accProvider = AccProvider()
#if accProvider.
accProvider.name = "Ezo net s.r.o"
accProvider.address_street_name = "Kostoľanská"
accProvider.address_street_number = "58"
accProvider.address_zip_code = "08005"
accProvider.address_city = "Košice"
accProvider.address_country = "Slovak Republic"
accProvider.contact_number = "+421944753951"
accProvider.email = "servis@ezonet.sk"
accProvider.ico = "0123456789"
accProvider.dic = "9876543210"
accProvider.accountNo = "0123456789/0900"
accProvider.tax = "19"

accProvider.save()
"""""