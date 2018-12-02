from __future__ import absolute_import

from .summary_modules_queries import getDataForCompUsersGraph
from evaluator.celery import evaluator


@evaluator.task
def comp_users(data):
    return getDataForCompUsersGraph(data)
