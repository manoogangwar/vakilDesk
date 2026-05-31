from django.urls import path
from .views import InvoiceListCreateView, InvoiceDetailView, PaymentListCreateView, PaymentDeleteView

urlpatterns = [
    path('', InvoiceListCreateView.as_view()),
    path('<int:pk>/', InvoiceDetailView.as_view()),
    path('<int:pk>/payments/', PaymentListCreateView.as_view()),
    path('<int:pk>/payments/<int:payment_pk>/', PaymentDeleteView.as_view()),
]
