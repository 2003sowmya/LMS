"""
Single place for sending notification emails.
Nothing else in the codebase should call Django's email functions directly.
"""
from django.core.mail import send_mail
from django.conf import settings


def send_notification_email(recipient, title, message):
    """
    Send one notification email.

    recipient : a User instance (must have an .email)
    title     : email subject (the Notification.title)
    message   : email body (the Notification.message)

    Returns True if an email was sent, False if it was skipped or failed.
    Never raises - a failed email must not break the request that triggered it.
    """
    email_address = getattr(recipient, "email", "") or ""
    email_address = email_address.strip()

    if not email_address:
        return False

    try:
        send_mail(
            subject=title,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email_address],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        print(f"[email] failed to send to {email_address}: {exc}")
        return False
