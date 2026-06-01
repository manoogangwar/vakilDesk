import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('category', models.CharField(
                    choices=[
                        ('affidavit', 'Affidavit'),
                        ('income_certificate', 'Income Certificate'),
                        ('domicile_certificate', 'Domicile Certificate'),
                        ('caste_certificate', 'Caste Certificate'),
                        ('legal_notice', 'Legal Notice'),
                        ('rent_agreement', 'Rent Agreement'),
                        ('noc', 'NOC'),
                        ('rti', 'RTI'),
                        ('power_of_attorney', 'Power of Attorney'),
                        ('other', 'Other'),
                    ],
                    default='other',
                    max_length=30,
                )),
                ('content', models.TextField()),
                ('variables', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='document_templates',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-updated_at']},
        ),
    ]
