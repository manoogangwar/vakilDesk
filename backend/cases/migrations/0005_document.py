import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0004_hearingrecord'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Document',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('doc_type', models.CharField(
                    choices=[
                        ('fir', 'FIR'), ('chargesheet', 'Charge Sheet'),
                        ('bail', 'Bail Papers'), ('vakalatnama', 'Vakalatnama'),
                        ('affidavit', 'Affidavit'), ('judgment', 'Judgment'),
                        ('order', 'Court Order'), ('evidence', 'Evidence'),
                        ('other', 'Other'),
                    ],
                    default='other',
                    max_length=20,
                )),
                ('file', models.FileField(upload_to='case_documents/%Y/%m/')),
                ('file_name', models.CharField(blank=True, max_length=255)),
                ('file_size', models.PositiveIntegerField(default=0)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('case', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='documents',
                    to='cases.case',
                )),
                ('uploaded_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='uploaded_documents',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
    ]
