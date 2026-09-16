"""
The only file in the project that talks to Razorpay.

Everything else - views, signals, admin - calls the functions here. If the
product ever needs a second gateway (some colleges will insist on their
bank's own), this is the file that changes and nothing else does.
"""

import hashlib
import hmac
from decimal import Decimal

import razorpay
from django.conf import settings


def get_client():
    """A Razorpay client built from the keys in .env."""
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


def to_paise(amount_in_rupees):
    """
    Razorpay counts in paise, the database counts in rupees.

    The conversion happens here and nowhere else, so there is exactly one
    place where money changes representation. 45000.50 -> 4500050.
    """
    return int(Decimal(str(amount_in_rupees)) * 100)


def create_order(amount_in_rupees, receipt):
    """
    Ask Razorpay to open an order and return its details.

    'receipt' is our own reference so a Razorpay order can be traced back
    to a row in our database.
    """
    client = get_client()
    return client.order.create({
        "amount": to_paise(amount_in_rupees),
        "currency": "INR",
        "receipt": str(receipt),
        "payment_capture": 1,
    })


def verify_payment_signature(order_id, payment_id, signature):
    """
    Check the signature the browser sent back after checkout.

    Razorpay signs 'order_id|payment_id' with our key secret. Anyone can
    POST to our verify endpoint claiming a payment succeeded; only Razorpay
    can produce a signature that matches. Returns True or False - never
    raises, so callers can treat a bad signature as an ordinary rejection.
    """
    message = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()

    # compare_digest, not ==, so the comparison takes the same time whether
    # the signature is wrong at the first character or the last
    return hmac.compare_digest(expected, signature or "")


def verify_webhook_signature(raw_body, signature):
    """
    Check a webhook sent by Razorpay directly to our server.

    Different secret from the one above, because this proves a different
    thing: not 'the student really paid' but 'this message really came
    from Razorpay'.

    raw_body must be the exact bytes received. Re-encoding the parsed JSON
    changes whitespace and key order, and the hash then never matches.
    """
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature or "")