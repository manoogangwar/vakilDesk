from django.urls import path
from .views import ClientListCreateView, ClientDetailView, ClientCasesView

urlpatterns = [
    path('', ClientListCreateView.as_view()),
    path('<int:pk>/', ClientDetailView.as_view()),
    path('<int:pk>/cases/', ClientCasesView.as_view()),
]
