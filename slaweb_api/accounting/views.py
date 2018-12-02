from . import accounting
from rest_framework import mixins
from core.framework.permissions import IsStaffUser
from core.framework.views import AbstractModuleViewSet
from core.framework.views import CachedViewSetMixin
from rest_framework.viewsets import ReadOnlyModelViewSet, ModelViewSet, GenericViewSet
from .serializers import *
from rest_framework import status
from rest_framework.response import Response
from evaluator.evaluator import *
from evaluator.acc_modules.schedules import schedule_bill_plan, delete_schedule_for_plan


class AccountingModuleViewSet(AbstractModuleViewSet):
    app = accounting
    serializer_class = BaseAccountingSerializer

    def get_data(self, module, query):
        return module.get_data(query)


class AccountingClientsViewSet(CachedViewSetMixin, ReadOnlyModelViewSet):
    queryset = AccUser.objects.all()
    serializer_class = AccUsersSerializer

    def list(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            return super(AccountingClientsViewSet, self).list(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)

    def retrieve(self, request, *args, **kwargs):
        if self.request.user.is_admin is True or self.request.user.pk == int(kwargs.get('pk')):
            return super(AccountingClientsViewSet, self).retrieve(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)


class criteriaEvaluate(AccountingModuleViewSet):
    allowed_methods = ['GET', 'POST']
    name = 'CriteriaEvaluate'
    serializer_class = BaseAccountingSerializer

    def list(self, request):
        acc_user_id = request.GET.get('accUserID', None)
        session_user_id = self.request.user.pk
        if acc_user_id is not None and (self.request.user.is_admin or int(acc_user_id) == session_user_id):
            result = default_criteria_evaluate(acc_user_id)
            ret = {
                'data': result,
                'status': 'ok'
            }
            return Response(ret, status=status.HTTP_200_OK)
        else:
            ret = {"detail": "You do not have permission to perform this action."}
            return Response(ret, status=status.HTTP_403_FORBIDDEN)

    def create(self, request):
        data = request.DATA
        files = request.FILES
        if self.request.user.is_admin or data['userId'] == self.request.user.pk:
            response = {
                'data': criteria_evaluate(data),
                'status': 'ok',
                'files': files
            }
            return Response(response, status=status.HTTP_200_OK)
        else:
            ret = {"detail": "You do not have permission to perform this action."}
            return Response(ret, status=status.HTTP_403_FORBIDDEN)


class createInvoiceView(AccountingModuleViewSet):
    allowed_methods = ['POST']
    name = 'CriteriaEvaluate'
    serializer_class = BaseAccountingSerializer

    def create(self, request):
        request = request.DATA
        if self.request.user.is_admin or request['userId'] == self.request.user.pk:
            result = create_invoice(request)
            if 'send' in request:
                return Response(result, status=status.HTTP_200_OK)
            return result
        else:
            ret = {"detail": "You do not have permission to perform this action."}
            return Response(ret, status=status.HTTP_403_FORBIDDEN)


class AccountingCriteriaViewSet(ModelViewSet):
    allowed_methods = ['GET', 'PUT', 'POST', 'DELETE']
    queryset = AccCriteria.objects.all()
    serializer_class = AccCriteriaSerializer

    def get_queryset(self):
        queryset = AccCriteria.objects.all()
        if hasattr(self, 'user_id') and self.user_id and self.request.user.is_admin:
            user = AccUser.objects.get(pk=self.user_id)
            return queryset.filter(user=user).order_by('priority')
        elif self.request.user.is_client:
            user = AccUser.objects.get(pk=self.request.user.pk)
            return queryset.filter(user=user).order_by('priority')
        return queryset.order_by('priority')

    def list(self, request, *args, **kwargs):
        self.user_id = request.QUERY_PARAMS.get('user_id')
        if self.user_id:
            self.user_id = int(self.user_id)
        return super(AccountingCriteriaViewSet, self).list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            return super(AccountingCriteriaViewSet, self).retrieve(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)

    def create(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            return super(AccountingCriteriaViewSet, self).create(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            return super(AccountingCriteriaViewSet, self).destroy(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)

    def update(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            return super(AccountingCriteriaViewSet, self).update(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)


class compareUsersDataVolumeView(AccountingModuleViewSet):
    allowed_methods = ['GET', 'POST']
    permission_classes = (IsStaffUser, )
    name = 'CompareUsers'
    serializer_class = BaseAccountingSerializer

    def list(self, request):
        result = compare_users(None)
        response = {
            'data': result,
            'status': 'ok',
        }
        return Response(response, status=status.HTTP_200_OK)

    def create(self, request):
        data = request.DATA
        files = request.FILES
        result = compare_users(data)
        response = {
            'data': result,
            'status': 'ok',
        }
        return Response(response, status=status.HTTP_200_OK)


class basicEvaluateView(AccountingModuleViewSet):
    allowed_methods = ['POST']
    name = 'BasicEvaluate'
    serializer_class = BaseAccountingSerializer

    def create(self, request):
        data = request.DATA
        if self.request.user.is_admin or data['userId'] == self.request.user.pk:
            response = {
                'data': basic_evaluation(data),
                'status': 'ok'
            }
            return Response(response, status=status.HTTP_200_OK)
        else:
            ret = {"detail": "You do not have permission to perform this action."}
            return Response(ret, status=status.HTTP_403_FORBIDDEN)


class BillingPlansViewSet(ModelViewSet):
    queryset = BillPlans.objects.all().order_by('name')
    serializer_class = BillPlansSerializer

    def get_queryset(self):
        queryset = BillPlans.objects.all()
        if not self.request.user.is_admin:
            user = AccUser.objects.get(pk=self.request.user.pk)
            queryset = queryset.filter(user=user)
        return queryset.order_by('name')

    def list(self, request, *args, **kwargs):
        return super(BillingPlansViewSet, self).list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            response = super(BillingPlansViewSet, self).retrieve(request, *args, **kwargs)
        else:
            response = Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)
        return response

    def create(self, request, *args, **kwargs):
        query = request.DATA
        if self.request.user.is_admin is True:
            response = super(BillingPlansViewSet, self).create(request, *args, **kwargs)
            if response.status_code == 201:
                schedule_bill_plan(query, response.data['id'])
        else:
            response = Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)
        return response

    def destroy(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            delete_schedule_for_plan(kwargs['pk'])
            response = super(BillingPlansViewSet, self).destroy(request, *args, **kwargs)
        else:
            response = Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)
        return response

    def update(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            response = super(BillingPlansViewSet, self).update(request, *args, **kwargs)
        else:
            response = Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)
        return response


class BillingPlansReportsViewSet(mixins.DestroyModelMixin, mixins.ListModelMixin, GenericViewSet):

    queryset = BillPlansReports.objects.all().order_by('exec_time_epoch')
    serializer_class = BillPlansReportsSerializer

    def get_queryset(self):
        queryset = BillPlansReports.objects.all()
        if not self.request.user.is_admin:
            user = AccUser.objects.get(pk=self.request.user.pk)
            queryset = queryset.filter(user=user)
        return queryset.order_by('exec_time_epoch')

    def destroy(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            response = super(BillingPlansReportsViewSet, self).destroy(request, *args, **kwargs)
        else:
            response = Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)
        return response