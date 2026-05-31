import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0002_case_status_court'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseClient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('case', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='case_clients', to='cases.case')),
                ('client', models.ForeignKey(
                    limit_choices_to={'role': 'client'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='case_memberships',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'unique_together': {('case', 'client')},
            },
        ),
    ]
