from django.urls import path
from .views import (
    ClientListCreateView, ClientDetailView, ClientCasesView,
    ClientDocumentListCreateView, ClientDocumentDeleteView,
)

urlpatterns = [
    path('', ClientListCreateView.as_view()),
    path('<int:pk>/', ClientDetailView.as_view()),
    path('<int:pk>/cases/', ClientCasesView.as_view()),
    path('<int:pk>/documents/', ClientDocumentListCreateView.as_view()),
    path('<int:pk>/documents/<int:doc_pk>/', ClientDocumentDeleteView.as_view()),
]
