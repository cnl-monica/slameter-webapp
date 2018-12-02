# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from abc import ABCMeta
import uuid
import logging
from django.db import close_old_connections
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authentication import TokenAuthentication, Token
from socketio.namespace import BaseNamespace
from core.framework.exceptions import WSException, ModuleDataConnectionError


class AbstractWSNamespace(BaseNamespace):
    __metaclass__ = ABCMeta

    def initialize(self):
        self.session[self.ns_name] = dict()
        self.ns_session = self.session[self.ns_name]

        self.logger = logging.getLogger('socketio')

    def on_subscribe(self, *args, **kwargs):
        subscription_token = self.save_subscription(*args, **kwargs)

        subscription = self.ns_session[subscription_token]
        state = subscription.get('state')

        if state == 'new':
            self.ns_session[subscription_token]['state'] = 'running'
            self.spawn(self.job_run_subscription, subscription_token)

        return [subscription_token, state]

    def save_subscription(self, *args, **kwargs):
        """
        This method should save subscription data on ns_session object into
        generated subscription_token key and return this subscription token.

        :param args:
        :param kwargs:
        :return: subscription token
        """
        raise NotImplemented('save_subscription method is not implemented.')

    def job_run_subscription(self, subscription_token):
        raise NotImplemented('no job implemented for subscriptions.')

    def process_packet(self, packet):
        try:
            return super(AbstractWSNamespace, self).process_packet(packet)
        except:
            raise
        finally:
            close_old_connections()

    def emit_error(self, error_code, error_message):
        error_id = uuid.uuid4().hex
        self.emit('error', error_id, {'code': error_code, 'message': error_message})
        return ['error', error_id]

    def exception_handler_decorator(self, fn):
        def wrap(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except WSException as wse:
                self.logger.exception(wse)
                return self.emit_error(wse.code, wse.message)
            except TypeError as te:
                self.logger.exception(te)
                return self.emit_error('type-error', te.args[0])
            except ModuleDataConnectionError as mce:
                self.logger.exception(mce)
                return self.emit_error(mce.status, mce.message)
        return wrap


class WSAuthenticationMixin(object):

    def get_initial_acl(self):
        return ['on_connect']

    def on_login(self, token):
        authenticator = TokenAuthentication()

        try:
            authenticator.authenticate_credentials(token)
        except AuthenticationFailed as e:
            return self.emit_error('error_login', e.detail)

        self.request.user = Token.objects.get(key=token).user

        self.lift_acl_restrictions()
        return ['OK']
