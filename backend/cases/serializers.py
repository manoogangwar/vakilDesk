from rest_framework import serializers
from .models import Case, Document, HearingRecord


class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField(read_only=True)
    uploaded_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'doc_type', 'file', 'file_url',
            'file_name', 'file_size', 'uploaded_by_name', 'uploaded_at',
        ]
        read_only_fields = ['id', 'file_url', 'file_name', 'file_size', 'uploaded_by_name', 'uploaded_at']
        extra_kwargs = {'file': {'write_only': True}}

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_uploaded_by_name(self, obj):
        u = obj.uploaded_by
        return (f"{u.first_name} {u.last_name}".strip()) or u.username


class HearingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HearingRecord
        fields = ['id', 'date', 'outcome', 'adjourned_to', 'created_at']
        read_only_fields = ['id', 'created_at']


class CaseSerializer(serializers.ModelSerializer):
    lawyer_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Case
        fields = [
            'id', 'case_name', 'case_number',
            'status', 'court_name', 'court_type', 'judge_name',
            'under_section', 'police_station',
            'next_date', 'previous_date',
            'payment_status', 'fee_amount', 'paid_amount',
            'notes', 'lawyer_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'lawyer_name']

    def get_lawyer_name(self, obj):
        u = obj.lawyer
        return (f"{u.first_name} {u.last_name}".strip()) or u.username

    def create(self, validated_data):
        validated_data['lawyer'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        new_next = validated_data.get('next_date', instance.next_date)
        if new_next and new_next != instance.next_date and instance.next_date:
            validated_data.setdefault('previous_date', instance.next_date)
            # Auto-record the hearing that just passed
            HearingRecord.objects.create(
                case=instance,
                date=instance.next_date,
                adjourned_to=new_next,
            )
        return super().update(instance, validated_data)
