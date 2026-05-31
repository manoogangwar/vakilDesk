from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Invoice, Payment
from .serializers import InvoiceSerializer, InvoiceSummarySerializer, PaymentSerializer


class InvoiceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return InvoiceSerializer if self.request.method == 'POST' else InvoiceSummarySerializer

    def get_queryset(self):
        qs = Invoice.objects.filter(lawyer=self.request.user).select_related('case')
        status_filter = self.request.query_params.get('status')
        case_id = self.request.query_params.get('case')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if case_id:
            qs = qs.filter(case__pk=case_id)
        return qs


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(lawyer=self.request.user).prefetch_related('payments')

    def destroy(self, request, *args, **kwargs):
        invoice = self.get_object()
        if invoice.status not in ('draft', 'cancelled'):
            return Response(
                {'error': 'Only draft or cancelled invoices can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_invoice(self):
        return Invoice.objects.get(pk=self.kwargs['pk'], lawyer=self.request.user)

    def get_queryset(self):
        return Payment.objects.filter(invoice__pk=self.kwargs['pk'], invoice__lawyer=self.request.user)

    def perform_create(self, serializer):
        invoice = self.get_invoice()
        payment = serializer.save(invoice=invoice)
        # Auto-update invoice status
        paid = float(invoice.paid_amount) + float(payment.amount)
        total = float(invoice.amount)
        if paid >= total:
            invoice.status = 'paid'
        elif paid > 0:
            invoice.status = 'partial'
        invoice.save(update_fields=['status'])


class PaymentDeleteView(generics.DestroyAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    pk_url_kwarg = 'payment_pk'

    def get_queryset(self):
        return Payment.objects.filter(invoice__lawyer=self.request.user)

    def perform_destroy(self, instance):
        invoice = instance.invoice
        instance.delete()
        # Recalculate status after deletion
        paid = float(invoice.paid_amount)
        total = float(invoice.amount)
        if paid <= 0:
            invoice.status = 'sent' if invoice.status in ('partial', 'paid') else invoice.status
        elif paid < total:
            invoice.status = 'partial'
        invoice.save(update_fields=['status'])
