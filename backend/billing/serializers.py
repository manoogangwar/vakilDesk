from rest_framework import serializers
from .models import Invoice, Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'payment_date', 'method', 'reference', 'notes', 'recorded_at']
        read_only_fields = ['id', 'recorded_at']


class InvoiceSerializer(serializers.ModelSerializer):
    paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    case_name = serializers.CharField(source='case.case_name', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    payments_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'case', 'case_name', 'case_number',
            'description', 'amount', 'paid_amount', 'balance',
            'status', 'issue_date', 'due_date', 'notes',
            'payments', 'payments_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'invoice_number', 'paid_amount', 'balance',
                            'case_name', 'case_number', 'payments', 'payments_count',
                            'created_at', 'updated_at']

    def get_payments_count(self, obj):
        return obj.payments.count()

    def create(self, validated_data):
        validated_data['lawyer'] = self.context['request'].user
        return super().create(validated_data)


class InvoiceSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for lists (no nested payments)."""
    paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    case_name = serializers.CharField(source='case.case_name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'case', 'case_name',
            'amount', 'paid_amount', 'balance',
            'status', 'issue_date', 'due_date', 'created_at',
        ]
        read_only_fields = fields
