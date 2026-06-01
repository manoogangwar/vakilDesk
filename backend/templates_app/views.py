from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DocumentTemplate
from .serializers import DocumentTemplateSerializer, DocumentTemplateSummarySerializer


class TemplateListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return DocumentTemplateSerializer if self.request.method == 'POST' else DocumentTemplateSummarySerializer

    def get_queryset(self):
        qs = DocumentTemplate.objects.filter(created_by=self.request.user)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class TemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DocumentTemplate.objects.filter(created_by=self.request.user)


class TemplateDuplicateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            original = DocumentTemplate.objects.get(pk=pk, created_by=request.user)
        except DocumentTemplate.DoesNotExist:
            return Response({'error': 'Template not found.'}, status=status.HTTP_404_NOT_FOUND)

        duplicate = DocumentTemplate.objects.create(
            created_by=request.user,
            name=f'{original.name} (Copy)',
            category=original.category,
            content=original.content,
        )
        return Response(
            DocumentTemplateSerializer(duplicate, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
