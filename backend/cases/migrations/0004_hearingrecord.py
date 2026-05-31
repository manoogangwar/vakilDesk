import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0003_caseclient'),
    ]

    operations = [
        migrations.CreateModel(
            name='HearingRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('outcome', models.TextField(blank=True)),
                ('adjourned_to', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('case', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='hearing_records',
                    to='cases.case',
                )),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
    ]
