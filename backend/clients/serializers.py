import secrets

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ClientProfile

User = get_user_model()


class ClientSerializer(serializers.ModelSerializer):
    # Flat user fields exposed directly on the serializer
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name', default='')
    last_name = serializers.CharField(source='user.last_name', default='')
    phone = serializers.CharField(source='user.phone', default='')
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = ClientProfile
        fields = [
            'id', 'user_id', 'username',
            'first_name', 'last_name', 'email', 'phone',
            'address', 'notes', 'is_active', 'created_at',
            'password',
        ]
        read_only_fields = ['id', 'user_id', 'username', 'is_active', 'created_at']

    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email', '')
        # Auto-generate username from email prefix, ensure uniqueness
        base = email.split('@')[0] if email else 'client'
        username = base
        n = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{n}"
            n += 1
        # Use provided password or generate one
        password = validated_data.pop('password', None) or secrets.token_urlsafe(12)
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            password=password,
            role='client',
        )
        user.phone = user_data.get('phone', '')
        user.save(update_fields=['phone'])
        profile = ClientProfile.objects.create(
            user=user,
            lawyer=self.context['request'].user,
            **validated_data,
        )
        # Attach generated username so the response can show login info
        profile._generated_username = username
        return profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            u = instance.user
            for field, val in user_data.items():
                setattr(u, field, val)
            u.save(update_fields=list(user_data.keys()))
        return super().update(instance, validated_data)
