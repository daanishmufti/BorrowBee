import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_borrow_request_email(to_email, from_user_name, book_title, message, from_user_email=None):
    """Send borrow request email using Gmail SMTP"""
    try:
        # Gmail SMTP configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        gmail_email = os.environ.get('GMAIL_EMAIL')
        gmail_password = os.environ.get('GMAIL_APP_PASSWORD')
        
        if not gmail_email or not gmail_password:
            logging.error("Gmail credentials not configured")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = gmail_email
        msg['To'] = to_email
        msg['Subject'] = f"📚 BorrowBee: Book Borrow Request for '{book_title}'"
        
        # Email body
        body = f"""
Hello!

You have received a new book borrow request through BorrowBee:

📖 Book: {book_title}
👤 Requested by: {from_user_name}
{f'📧 Contact: {from_user_email}' if from_user_email else ''}

💬 Message:
{message}

---
Please respond to this request directly to arrange book borrowing details.

Best regards,
BorrowBee Team
🍯 Your Digital Library Community
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(gmail_email, gmail_password)
            server.send_message(msg)
        
        logging.info(f"Borrow request email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send email: {e}")
        return False

def send_notification_email(to_email, subject, message):
    """Send general notification email"""
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        gmail_email = os.environ.get('GMAIL_EMAIL')
        gmail_password = os.environ.get('GMAIL_APP_PASSWORD')
        
        if not gmail_email or not gmail_password:
            logging.error("Gmail credentials not configured")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = gmail_email
        msg['To'] = to_email
        msg['Subject'] = f"🍯 BorrowBee: {subject}"
        
        body = f"""
{message}

---
Best regards,
BorrowBee Team
🍯 Your Digital Library Community
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(gmail_email, gmail_password)
            server.send_message(msg)
        
        logging.info(f"Notification email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send notification email: {e}")
        return False