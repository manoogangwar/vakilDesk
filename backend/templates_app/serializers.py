from rest_framework import serializers
from .models import DocumentTemplate


class DocumentTemplateSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'category', 'category_display',
            'content', 'variables', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'variables', 'category_display', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DocumentTemplateSummarySerializer(serializers.ModelSerializer):
    """Lightweight — no content field for list views."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = DocumentTemplate
        fields = ['id', 'name', 'category', 'category_display', 'variables', 'updated_at']
        read_only_fields = fields
