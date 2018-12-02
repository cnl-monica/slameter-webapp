from django.db import models


class Ports(models.Model):
    name = models.CharField(max_length=120)
    ports = models.CharField(max_length=512)

    def __unicode__(self):
        return 'Label of ports: ' + str(self.name)


class Dscp(models.Model):
    label = models.CharField(max_length=50)
    dscp_class = models.DecimalField(max_digits=2, decimal_places=0)

    def __unicode__(self):
        return 'Dscp class: ' + str(self.label) + '- decimal value: ' + str(self.dscp_class)


class TransportProtocols(models.Model):
    label = models.CharField(max_length=50)
    protocol = models.DecimalField(max_digits=3, decimal_places=0)

    def __unicode__(self):
        return 'Dscp class: ' + str(self.label) + '- decimal value: ' + str(self.dscp_class)