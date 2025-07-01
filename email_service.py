import os
import smtplib
import logging
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_borrow_request_email(to_email, from_user_name, book_title, message, from_user_email=None):
    """Send borrow request email using Gmail SMTP with enhanced PythonAnywhere compatibility"""
    try:
        # Gmail SMTP configuration
        smtp_server = "smtp.gmail.com"
        gmail_email = os.environ.get('GMAIL_EMAIL')
        gmail_password = os.environ.get('GMAIL_APP_PASSWORD')

        if not gmail_email or not gmail_password:
            logger.error("Gmail credentials not configured. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD")
            logger.error("Note: Use Gmail App Password (16 characters), not regular password")
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

        # Try multiple SMTP configurations for better PythonAnywhere compatibility
        smtp_configs = [
            {'port': 587, 'use_ssl': False, 'method': 'STARTTLS'},
            {'port': 465, 'use_ssl': True, 'method': 'SSL'}
        ]

        for config in smtp_configs:
            try:
                if config['use_ssl']:
                    # SSL connection (port 465)
                    context = ssl.create_default_context()
                    server = smtplib.SMTP_SSL(smtp_server, config['port'], context=context)
                else:
                    # STARTTLS connection (port 587)
                    server = smtplib.SMTP(smtp_server, config['port'])
                    server.starttls()

                server.login(gmail_email, gmail_password)
                server.send_message(msg)
                server.quit()

                logger.info(f"Borrow request email sent successfully to {to_email} via {config['method']}")
                return True

            except Exception as method_error:
                logger.warning(f"{config['method']} method failed: {method_error}")
                continue

        logger.error("All SMTP methods failed. Check Gmail App Password and 2FA settings")
        return False

    except Exception as e:
        logger.error(f"Failed to send borrow request email: {e}")
        logger.error("Troubleshooting tips:")
        logger.error("1. Ensure 2-Factor Authentication is enabled on Gmail")
        logger.error("2. Use App Password (16 characters) instead of regular password")
        logger.error("3. Check GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables")
        return False

def send_notification_email(to_email, subject, message):
    """Send general notification email with enhanced PythonAnywhere compatibility"""
    try:
        smtp_server = "smtp.gmail.com"
        gmail_email = os.environ.get('GMAIL_EMAIL')
        gmail_password = os.environ.get('GMAIL_APP_PASSWORD')

        if not gmail_email or not gmail_password:
            logger.error("Gmail credentials not configured")
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

        # Try multiple SMTP configurations
        smtp_configs = [
            {'port': 587, 'use_ssl': False, 'method': 'STARTTLS'},
            {'port': 465, 'use_ssl': True, 'method': 'SSL'}
        ]

        for config in smtp_configs:
            try:
                if config['use_ssl']:
                    context = ssl.create_default_context()
                    server = smtplib.SMTP_SSL(smtp_server, config['port'], context=context)
                else:
                    server = smtplib.SMTP(smtp_server, config['port'])
                    server.starttls()

                server.login(gmail_email, gmail_password)
                server.send_message(msg)
                server.quit()

                logger.info(f"Notification email sent successfully to {to_email} via {config['method']}")
                return True

            except Exception as method_error:
                logger.warning(f"{config['method']} method failed: {method_error}")
                continue

        logger.error("All SMTP methods failed for notification email")
        return False

    except Exception as e:
        logger.error(f"Failed to send notification email: {e}")
        return False

def test_email_configuration():
    """Test Gmail SMTP configuration"""
    gmail_email = os.environ.get('GMAIL_EMAIL')
    gmail_password = os.environ.get('GMAIL_APP_PASSWORD')

    if not gmail_email or not gmail_password:
        logger.error("Gmail credentials missing")
        return False, "Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD environment variables"

    try:
        # Test STARTTLS
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(gmail_email, gmail_password)
        server.quit()
        logger.info("Gmail SMTP test successful")
        return True, "Gmail SMTP configuration working"
    except Exception as e:
        try:
            # Test SSL
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context)
            server.login(gmail_email, gmail_password)
            server.quit()
            logger.info("Gmail SMTP SSL test successful")
            return True, "Gmail SMTP SSL configuration working"
        except Exception as ssl_error:
            logger.error(f"Both SMTP methods failed: STARTTLS: {e}, SSL: {ssl_error}")
            return False, f"SMTP test failed: {e}"