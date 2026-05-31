from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClientProfile
from .serializers import ClientSerializer


class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ClientProfile.objects.filter(lawyer=self.request.user).select_related('user')
        search = self.request.query_params.get('search', '')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__phone__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        from rest_framework import status as drf_status
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        data = serializer.data
        # Include the auto-generated username in the creation response
        data['username'] = instance._generated_username if hasattr(instance, '_generated_username') else instance.user.username
        return Response(data, status=drf_status.HTTP_201_CREATED)


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ClientProfile.objects.filter(lawyer=self.request.user).select_related('user')


class ClientCasesView(APIView):
    """Return all cases linked to a client (owned by the requesting lawyer)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            profile = ClientProfile.objects.get(pk=pk, lawyer=request.user)
        except ClientProfile.DoesNotExist:
            return Response({'error': 'Client not found.'}, status=status.HTTP_404_NOT_FOUND)
        from cases.models import Case
        from cases.serializers import CaseSerializer
        cases = Case.objects.filter(lawyer=request.user, case_clients__client=profile.user)
        return Response(CaseSerializer(cases, many=True, context={'request': request}).data)
