# -*- coding: utf-8 -*-
"""
Data connectors for netstat modules.
"""

from __future__ import unicode_literals

import time
import gevent
from gevent._semaphore import Timeout
import redis
import simplejson as json

from core.framework.base import AbstractDataConnector

Pool = redis.ConnectionPool(host='localhost', port=6379, db=0)

class EvaluatorDataConnector(AbstractDataConnector):
    """
    Creates connection to Evaluator.
    """
    def __init__(self, module_name, config_name):
        """
        Constructor.

        :param module_name: name of the Evaluator module to call
        """
        super(EvaluatorDataConnector, self).__init__(module_name)


    def get_data(self, request):
        """
        Gets module data from Evaluator.

        :param request: filter request

        :return: module data
        :rtype dict
        """

        r = redis.Redis(connection_pool=Pool)
        sig_pubsub = redis.Redis(connection_pool=Pool).pubsub()

        def sig_check_task(pubsub):
            for message in pubsub.listen():
                if message['data'] == 'OK':
                    return

        sig_pubsub.subscribe(self.module_name+'SIG')
        sig_check = gevent.spawn(sig_check_task, sig_pubsub)

        try:
            r.publish(self.module_name,json.dumps(request))

            sig_check.get(timeout=5)


            self.logger.info('Sending request to Evaluator from module %s: %s' %
                             ( self.module_name, json.dumps(request)))

            sig_pubsub = r.pubsub()
            sig_pubsub.subscribe('Response'+self.module_name)

            for message in sig_pubsub.listen():
                if message['channel'] == 'Response'+self.module_name and message['data'] != 1:
                    response = message['data']
                    print message['data']
                    break

        except Timeout:
            response = json.dumps({"response":"Evaluator is off or try again","status":"error","name":self.module_name})


        print response
        return json.loads(response)