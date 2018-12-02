# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import uuid

from django.http import Http404
import gevent
import redis
import simplejson as json
from rest_framework.authentication import Token

from core.framework.exceptions import WSProcessingException, WSException, ModuleDataConnectionError
from core.framework.permissions import CanAccessApp
from core.framework.websocket import WSAuthenticationMixin, AbstractWSNamespace

from . import ids
from core.models import User



class IdsWebSocketNamespace(AbstractWSNamespace, WSAuthenticationMixin):
    """
    This class enables client to use websocket for module data retrieval.
    """

    def __init__(self, *args, **kwargs):
        super(IdsWebSocketNamespace, self).__init__(*args, **kwargs)
        # force FilterQuerySerializer to output query in correct format
        # by setting json as requested media type on `request` object
        # (see method get_module_data, where request is used)
        self.request.accepted_media_type = 'application/json'

    def on_login(self, token):

        login = super(IdsWebSocketNamespace, self).on_login(token)

        if login[0] == 'OK':
            can_access_app = CanAccessApp()

            if not can_access_app.has_object_permission(self.request, None, ids):
                raise WSProcessingException('400', 'No permission to access `%s` app' % ids.name)

        return login

    def get_module(self, module_name):
        """
        Gets module in app with given module_name.

        :param unicode module_name: name of the module
        :return module with given name
        :rtype AbstractModule
        """
        try:
            module_class = ids.get_module_class_by_name(module_name)
        except Http404 as e:
            raise WSProcessingException('404', e.args[0])

        return module_class(self.request.user)

    def get_module_data(self, module, query, section_name):
        module_data = module.get_data(query, section_name)

        return module_data


class IDSWebsocketNamespace(AbstractWSNamespace, WSAuthenticationMixin):

    def get_module(self, module_name):
        """
        Gets module in app with given module_name.

        :param unicode module_name: name of the module
        :return module with given name
        :rtype AbstractModule
        """
        try:
            module_class = ids.get_module_class_by_name(module_name)
        except Http404 as e:
            raise WSProcessingException('404', e.args[0])

        return module_class(self.request.user)

    def on_subscribe(self, module_name):
        """
        Event for creating subscription to receive module data repeatedly in certain interval.

        :param unicode module_name: name of the module
        :param query: query to pass to the module
        :return subscription token identifying this subscription and state if the server-side process
        """
        # toto som odkomentoval
        # module = self.get_module(module_name)
        module = module_name

        subscription_token = ids.name + '$' + module_name

        if not subscription_token in self.ns_session:
            self.ns_session[subscription_token] = {
                'module': module_name,
                'state': 'running',
            }

        self.spawn(self.job_serve_module_data, subscription_token, module_name)

        return [subscription_token, self.ns_session[subscription_token]['state']]

    def on_control(self, subscription_token, command, value=None):
        if subscription_token in self.ns_session:
            if command == 'unsubscribe':
                self.ns_session[subscription_token]['state'] = 'unsubscribed'
            else:
                raise WSException('400', 'Bad command')
        else:
            raise WSException('400', 'Bad subscription token')

        return [self.ns_session[subscription_token]['state']]

    def recv_disconnect(self):
        """
        Unsubscribe all remaining subscriptions on websocket disconnection.
        """
        for item in self.ns_session:
            subscription = self.ns_session[item]
            if isinstance(subscription, dict) and 'state' in subscription:
                subscription['state'] = 'unsubscribed'

    def job_serve_module_data(self, subscription_token, module_name):

        subscription = self.ns_session[subscription_token] # = # subscription = {u'state': u'running', u'module': 'idsSettings'}
        state = subscription['state']   # = u'running'
        n = 0
        #print module_name

        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.publish('IDS', module_name + '.start')

        p = r.pubsub()

        # Aby sme vedeli pre ktory modul su prichadzajuce data urcene
        p.subscribe(module_name)


        # message = {'pattern': None, 'type': 'subscribe', 'channel': 'idsSettings', 'data': 1L}
        for message in p.listen():
            if message['data'] != 1:
                if message['data'] != 0:
                    #{'pattern': None, 'type': 'message', 'channel': 'IdsFinFloodAttack', 'data': '{"time": 1428619397503,"IdsFinFloodAttack": 0}'}
                    data = json.loads(message['data'])
                    #data = {'IdsFinFloodAttack': 0, 'time': 1428619397503L}

                    self.emit(subscription_token, [data['time'], data['count'], data['attack']])

            subscription = self.ns_session[subscription_token]
            state = subscription['state']

            if state == 'unsubscribed':
                p.unsubscribe(module_name)
                r.publish('IDS', module_name + '.stop')

        # after client unsubscribes, delete subscription record from session
        del self.ns_session[subscription_token]