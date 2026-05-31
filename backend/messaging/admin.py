from django.contrib import admin
from .models import Message, PushToken

admin.site.register(Message)
admin.site.register(PushToken)
