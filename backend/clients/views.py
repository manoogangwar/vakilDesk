from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
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


class ClientDocumentListCreateView(generics.ListCreateAPIView):
    """List a client's documents, or save a generated document to the client."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        from cases.serializers import DocumentSerializer
        return DocumentSerializer

    def get_queryset(self):
        from cases.models import Document
        profile = ClientProfile.objects.filter(
            pk=self.kwargs['pk'], lawyer=self.request.user
        ).first()
        if not profile:
            return Document.objects.none()
        return Document.objects.filter(client=profile.user)

    def perform_create(self, serializer):
        profile = ClientProfile.objects.get(pk=self.kwargs['pk'], lawyer=self.request.user)
        uploaded_file = self.request.FILES.get('file')
        serializer.save(
            client=profile.user,
            uploaded_by=self.request.user,
            file_name=uploaded_file.name if uploaded_file else '',
            file_size=uploaded_file.size if uploaded_file else 0,
        )


class ClientDocumentDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    pk_url_kwarg = 'doc_pk'

    def get_serializer_class(self):
        from cases.serializers import DocumentSerializer
        return DocumentSerializer

    def get_queryset(self):
        from cases.models import Document
        # Only documents this lawyer saved, for clients they manage.
        return Document.objects.filter(
            uploaded_by=self.request.user,
            client__client_profile__lawyer=self.request.user,
        )
