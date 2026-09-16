from django.db import migrations


class Migration(migrations.Migration):
    """
    The FeePayment table was created with a column called recorded_at, but
    models.py was later changed to created_at without a migration. Django's
    state and the real schema have disagreed ever since, so every write to
    FeePayment failed.

    RunSQL because Django's own migration state already believes the column
    is called created_at - a RenameField would try to rename a column it
    thinks already has the new name. state_operations is empty for the same
    reason: only the database needs correcting, not Django's picture of it.
    """

    dependencies = [
        ("courses", "0025_feepayment_gateway_payment_id_paymenttransaction"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE courses_feepayment RENAME COLUMN recorded_at TO created_at;",
            reverse_sql="ALTER TABLE courses_feepayment RENAME COLUMN created_at TO recorded_at;",
        ),
    ]