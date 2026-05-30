from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Case
from .serializers import CaseSerializer


class CaseListCreateView(generics.ListCreateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Case.objects.filter(lawyer=self.request.user)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(case_name__icontains=search)
        return qs


class CaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Case.objects.filter(lawyer=self.request.user)
