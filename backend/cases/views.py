import datetime

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Case, CaseClient, HearingRecord
from .serializers import CaseSerializer, HearingRecordSerializer

User = get_user_model()


class CaseListCreateView(generics.ListCreateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        qs = Case.objects.filter(lawyer=self.request.user)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(case_name__icontains=search) | Q(case_number__icontains=search))
        return qs


class CaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Case.objects.filter(lawyer=self.request.user)


class UpcomingHearingsView(generics.ListAPIView):
    """All lawyer's cases that have a next_date >= today, ordered by next_date."""
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        today = datetime.date.today()
        return Case.objects.filter(
            lawyer=self.request.user,
            next_date__gte=today,
        ).order_by('next_date')


class HearingRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = HearingRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HearingRecord.objects.filter(
            case__pk=self.kwargs['pk'],
            case__lawyer=self.request.user,
        )

    def perform_create(self, serializer):
        case = Case.objects.get(pk=self.kwargs['pk'], lawyer=self.request.user)
        serializer.save(case=case)


class CaseClientListView(APIView):
    """List clients linked to a case, or link a new client."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        case = self._get_case(pk, request)
        if case is None:
            return Response({'error': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
        from clients.serializers import ClientSerializer
        from clients.models import ClientProfile
        profiles = ClientProfile.objects.filter(
            user__case_memberships__case=case
        ).select_related('user')
        return Response(ClientSerializer(profiles, many=True, context={'request': request}).data)

    def post(self, request, pk):
        case = self._get_case(pk, request)
        if case is None:
            return Response({'error': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
        client_id = request.data.get('client_id')
        try:
            client = User.objects.get(pk=client_id, role='client')
        except User.DoesNotExist:
            return Response({'error': 'Client not found.'}, status=status.HTTP_404_NOT_FOUND)
        _, created = CaseClient.objects.get_or_create(case=case, client=client)
        return Response(
            {'linked': True, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def _get_case(self, pk, request):
        try:
            return Case.objects.get(pk=pk, lawyer=request.user)
        except Case.DoesNotExist:
            return None


class CaseClientUnlinkView(APIView):
    """Remove a client from a case."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, client_id):
        try:
            case = Case.objects.get(pk=pk, lawyer=request.user)
            client = User.objects.get(pk=client_id)
        except (Case.DoesNotExist, User.DoesNotExist):
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        CaseClient.objects.filter(case=case, client=client).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
