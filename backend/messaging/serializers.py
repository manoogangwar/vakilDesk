from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Message

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField(read_only=True)
    receiver_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name',
                  'case', 'text', 'is_read', 'sent_at']
        read_only_fields = ['id', 'sender', 'sender_name', 'receiver_name', 'is_read', 'sent_at']

    def _display(self, user):
        return (f"{user.first_name} {user.last_name}".strip()) or user.username

    def get_sender_name(self, obj):
        return self._display(obj.sender)

    def get_receiver_name(self, obj):
        return self._display(obj.receiver)

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class ConversationSerializer(serializers.Serializer):
    """Summary of a conversation with one contact."""
    user_id = serializers.IntegerField()
    user_name = serializers.CharField()
    user_role = serializers.CharField()
    last_message = serializers.CharField()
    last_sent_at = serializers.DateTimeField()
    unread_count = serializers.IntegerField()
