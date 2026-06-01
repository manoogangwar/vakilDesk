import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0005_document'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='case',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='documents',
                to='cases.case',
            ),
        ),
        migrations.AddField(
            model_name='document',
            name='client',
            field=models.ForeignKey(
                blank=True,
                null=True,
                limit_choices_to={'role': 'client'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='client_documents',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='document',
            name='doc_category',
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name='document',
            name='source',
            field=models.CharField(
                choices=[('uploaded', 'Uploaded'), ('generated', 'Generated')],
                default='uploaded',
                max_length=20,
            ),
        ),
    ]
