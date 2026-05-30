from rest_framework import serializers
from .models import Case


class CaseSerializer(serializers.ModelSerializer):
    lawyer_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Case
        fields = [
            'id', 'case_name', 'case_number',
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
        # When next_date changes, shift the old next_date into previous_date automatically
        new_next = validated_data.get('next_date', instance.next_date)
        if new_next and new_next != instance.next_date and instance.next_date:
            validated_data.setdefault('previous_date', instance.next_date)
        return super().update(instance, validated_data)
