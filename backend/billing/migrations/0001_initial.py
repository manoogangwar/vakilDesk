import datetime
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cases', '0005_document'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invoice_number', models.CharField(blank=True, max_length=50, unique=True)),
                ('description', models.TextField(blank=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(
                    choices=[('draft','Draft'),('sent','Sent'),('partial','Partial'),('paid','Paid'),('overdue','Overdue'),('cancelled','Cancelled')],
                    default='draft', max_length=20,
                )),
                ('issue_date', models.DateField(default=datetime.date.today)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('case', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='cases.case')),
                ('lawyer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('payment_date', models.DateField(default=datetime.date.today)),
                ('method', models.CharField(
                    choices=[('cash','Cash'),('bank_transfer','Bank Transfer'),('upi','UPI'),('cheque','Cheque'),('other','Other')],
                    default='cash', max_length=20,
                )),
                ('reference', models.CharField(blank=True, max_length=255)),
                ('notes', models.TextField(blank=True)),
                ('recorded_at', models.DateTimeField(auto_now_add=True)),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='billing.invoice')),
            ],
            options={'ordering': ['-payment_date']},
        ),
    ]
