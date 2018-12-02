# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.core.urlresolvers import reverse
from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token

USERNAME_FIELD = "email"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            msg = "User must have an email address"
            raise ValueError(msg)
        user = self.model(email=UserManager.normalize_email(email))
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        user = self.create_user(email, password=password)
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(verbose_name="email address",
                              max_length=255, unique=True, db_index=True)
    USERNAME_FIELD = USERNAME_FIELD
    REQUIRED_FIELDS = []

    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    def get_full_name(self):
        return self.email

    def get_short_name(self):
        return self.email

    def get_url(self):
        return reverse('user-detail', args=[str(self.id)])

    @property
    def is_client(self):
        return Client.objects.filter(email=self.email).exists()

    def to_client(self):
        return Client.objects.get(email=self.email)

    def __unicode__(self):
        return self.email


class Client(User):
    name = models.CharField(max_length=200)

    ip_address = models.GenericIPAddressField()
    exporter = models.ForeignKey('Exporter')

    def __unicode__(self):
        return self.name


# Catch user creation signal and generate authentication token for that user
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)
post_save.connect(create_auth_token, User)
post_save.connect(create_auth_token, Client)


class Exporter(models.Model):
    title = models.CharField(max_length=200)
    exporter_id = models.IntegerField()

    class Meta:
        ordering = ['exporter_id']

    def __unicode__(self):
        return "<Exporter %d>" % self.exporter_id