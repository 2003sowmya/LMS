import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from django.db import connection
c = connection.cursor()
c.execute("SELECT column_name FROM information_schema.columns WHERE table_name = %s ORDER BY column_name", ["courses_conversationmessage"])
print([r[0] for r in c.fetchall()])
