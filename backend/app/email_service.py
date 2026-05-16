import os
import smtplib
import logging
from email.message import EmailMessage
from typing import Optional

logger = logging.getLogger(__name__)

SMTP_HOST     = os.getenv("SMTP_HOST", "mailhog")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "1025"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


async def send_email(
    to: str,
    subject: str,
    body: str,
    attachment_name: Optional[str] = None,
    attachment_content: Optional[str] = None,
    attachment_mime: str = "text/plain",
) -> bool:
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"]    = SMTP_USER or "cloudcost@localhost"
        msg["To"]      = to
        msg.set_content(body)

        if attachment_name and attachment_content is not None:
            maintype, subtype = attachment_mime.split("/", 1)
            msg.add_attachment(
                attachment_content.encode("utf-8"),
                maintype=maintype,
                subtype=subtype,
                filename=attachment_name,
            )

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_PORT == 587:
                server.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info("Email sent to %s subject=%r", to, subject)
        return True
    except Exception as exc:
        logger.error("Email failed to %s: %s", to, exc)
        return False


async def send_alert_email(to: str, subject: str, body: str) -> bool:
    return await send_email(to=to, subject=subject, body=body)
