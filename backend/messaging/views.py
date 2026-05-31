from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Message, PushToken
from .serializers import MessageSerializer

User = get_user_model()


def _display(user):
    return (f"{user.first_name} {user.last_name}".strip()) or user.username


class ConversationsView(APIView):
    """Return a summary list: one entry per unique conversation partner."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
        msgs = Message.objects.filter(
            Q(sender=me) | Q(receiver=me)
        ).select_related('sender', 'receiver').order_by('sent_at')

        # Build conversations dict keyed by the other user's id
        convs: dict = {}
        for m in msgs:
            other = m.receiver if m.sender == me else m.sender
            oid = other.id
            if oid not in convs:
                convs[oid] = {
                    'user_id': oid,
                    'user_name': _display(other),
                    'user_role': other.role,
                    'last_message': m.text,
                    'last_sent_at': m.sent_at.isoformat(),
                    'unread_count': 0,
                }
            else:
                convs[oid]['last_message'] = m.text
                convs[oid]['last_sent_at'] = m.sent_at.isoformat()
            if not m.is_read and m.receiver == me:
                convs[oid]['unread_count'] += 1

        return Response(sorted(convs.values(), key=lambda c: c['last_sent_at'], reverse=True))


class ThreadView(APIView):
    """All messages between the current user and another user."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        me = request.user
        msgs = Message.objects.filter(
            (Q(sender=me) & Q(receiver__id=user_id)) |
            (Q(sender__id=user_id) & Q(receiver=me))
        ).select_related('sender', 'receiver').order_by('sent_at')

        # Mark incoming messages as read
        msgs.filter(receiver=me, is_read=False).update(is_read=True)

        return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)

    def post(self, request, user_id):
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Message text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            receiver = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        case_id = request.data.get('case')
        msg = Message.objects.create(
            sender=request.user,
            receiver=receiver,
            text=text,
            case_id=case_id if case_id else None,
        )
        return Response(
            MessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ContactsView(APIView):
    """Users the current user can message (clients for lawyer, lawyer for client)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
        if me.role == 'client':
            # Client can only message their lawyer
            from clients.models import ClientProfile
            try:
                profile = ClientProfile.objects.select_related('lawyer').get(user=me)
                lawyer = profile.lawyer
                if lawyer:
                    return Response([{
                        'user_id': lawyer.id,
                        'user_name': _display(lawyer),
                        'user_role': lawyer.role,
                    }])
            except ClientProfile.DoesNotExist:
                pass
            return Response([])
        else:
            # Lawyer can message their clients
            from clients.models import ClientProfile
            profiles = ClientProfile.objects.filter(lawyer=me).select_related('user')
            return Response([{
                'user_id': p.user.id,
                'user_name': _display(p.user),
                'user_role': 'client',
            } for p in profiles])


class PushTokenView(APIView):
    """Register or update an Expo push token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        PushToken.objects.update_or_create(
            token=token,
            defaults={'user': request.user},
        )
        return Response({'registered': True})
