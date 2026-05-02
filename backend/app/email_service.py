import smtplib
from email.message import EmailMessage
import os
from typing import Optional

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "anaselsayed757@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "eogv rxtv bocq zstv")

async def send_email(
    to: str,
    subject: str,
    body: str,
    attachment_name: Optional[str] = None,
    attachment_content: Optional[str] = None,
    attachment_mime: str = "text/plain",
):
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"]    = SMTP_USER
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
            if SMTP_USER and SMTP_PASSWORD and SMTP_HOST not in {"mailhog", "localhost", "127.0.0.1"}:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"[email] sent to {to}")
        return True
    except Exception as e:
        print(f"[email] failed: {e}")
        return False


async def send_alert_email(to: str, subject: str, body: str):
    return await send_email(to=to, subject=subject, body=body)
