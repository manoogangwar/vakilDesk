from django.urls import path
from .views import ConversationsView, ThreadView, ContactsView, PushTokenView

urlpatterns = [
    path('conversations/', ConversationsView.as_view()),
    path('contacts/', ContactsView.as_view()),
    path('thread/<int:user_id>/', ThreadView.as_view()),
    path('push-token/', PushTokenView.as_view()),
]
