import os
from dotenv import load_dotenv
load_dotenv()

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email():
    gmail_email = os.getenv("GMAIL_EMAIL")
    gmail_password = os.getenv("GMAIL_APP_PASSWORD")
    to_email = "your@email.com"  # Replace with your own

    if not gmail_email or not gmail_password:
        print("Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD in .env")
        return

    message = MIMEMultipart()
    message["From"] = gmail_email
    message["To"] = to_email
    message["Subject"] = "Test Email from Python"

    body = "Hello!\nThis is a test email sent via Gmail SMTP and Python."
    message.attach(MIMEText(body, "plain"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls(context=context)
            server.login(gmail_email, gmail_password)
            server.send_message(message)
        print("✅ Email sent successfully!")
    except Exception as e:
        print("❌ Failed to send email:", e)

if __name__ == "__main__":
    send_email()
