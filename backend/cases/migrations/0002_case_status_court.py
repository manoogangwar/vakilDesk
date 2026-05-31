from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='case',
            name='status',
            field=models.CharField(
                choices=[('open', 'Open'), ('adjourned', 'Adjourned'), ('disposed', 'Disposed'), ('on_hold', 'On Hold')],
                default='open',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='case',
            name='court_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='case',
            name='court_type',
            field=models.CharField(
                blank=True,
                choices=[('district', 'District Court'), ('high_court', 'High Court'), ('supreme_court', 'Supreme Court'), ('tribunal', 'Tribunal'), ('other', 'Other')],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='case',
            name='judge_name',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
