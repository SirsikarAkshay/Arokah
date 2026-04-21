from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('itinerary', '0003_add_saved_recommendation_to_trip'),
    ]

    operations = [
        migrations.AlterField(
            model_name='trip',
            name='destination',
            field=models.CharField(max_length=400),
        ),
        migrations.AddField(
            model_name='trip',
            name='country',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='trip',
            name='cities',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
