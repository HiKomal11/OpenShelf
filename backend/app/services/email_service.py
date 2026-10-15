
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings


logger = logging.getLogger(__name__)


def send_verification_email(
    recipient_email: str,
    verification_url: str,
) -> None:
    """Send an account verification email through Gmail SMTP."""

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise RuntimeError(
            "Gmail SMTP credentials are not configured."
        )

    from_email = (
        settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    )

    message = EmailMessage()
    message["Subject"] = "Verify your OpenShelf email address"
    message["From"] = from_email
    message["To"] = recipient_email

    expiry_minutes = settings.EMAIL_VERIFICATION_EXPIRE_MINUTES

    # Plain-text version for email clients that do not support HTML.
    message.set_content(
        "Welcome to OpenShelf.\n\n"
        "Please verify your email address using this link:\n"
        f"{verification_url}\n\n"
        f"This link expires in {expiry_minutes} minutes.\n\n"
        "If you did not create an OpenShelf account, you can "
        "ignore this email."
    )

    # HTML version for a better email experience.
    message.add_alternative(
        f"""
        <!DOCTYPE html>
        <html lang="en">
        <body style="margin: 0; padding: 24px;
                     background-color: #f3f4f6;
                     font-family: Arial, sans-serif;
                     color: #222;">
            <div style="max-width: 600px; margin: 0 auto;
                        padding: 28px; background-color: #ffffff;
                        border-radius: 10px;">
                <h2 style="margin-top: 0; color: #2563eb;">
                    Welcome to OpenShelf!
                </h2>

                <p style="line-height: 1.6;">
                    Please verify your email address to activate
                    your OpenShelf account.
                </p>

                <p style="margin: 28px 0;">
                    <a href="{verification_url}"
                       style="display: inline-block;
                              padding: 12px 20px;
                              background-color: #2563eb;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 6px;
                              font-weight: bold;">
                        Verify my email
                    </a>
                </p>

                <p style="font-size: 14px; line-height: 1.6;">
                    This verification link expires in
                    {expiry_minutes} minutes.
                </p>

                <p style="font-size: 14px; line-height: 1.6;">
                    If the button does not work, copy and paste
                    the following link into your browser:
                </p>

                <p style="font-size: 13px; overflow-wrap: anywhere;">
                    <a href="{verification_url}">
                        {verification_url}
                    </a>
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb;
                           margin: 24px 0;">

                <p style="font-size: 13px; color: #6b7280;">
                    If you did not create an OpenShelf account,
                    you can safely ignore this email.
                </p>
            </div>
        </body>
        </html>
        """,
        subtype="html",
    )

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=30,
        ) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()

            server.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )

            server.send_message(message)

        logger.info(
            "Verification email sent successfully to %s.",
            recipient_email,
        )

    except Exception:
        logger.exception(
            "Failed to send a verification email to %s.",
            recipient_email,
        )
        raise