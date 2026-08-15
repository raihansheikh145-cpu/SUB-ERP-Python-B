import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from the root .env file
root_env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=root_env_path)

logger = logging.getLogger(__name__)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465 # SSL port
SENDER_EMAIL = os.environ.get("SMTP_SENDER", "raihansheikh145@gmail.com")
SENDER_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")

def send_password_reset_email(to_email: str, reset_token: str):
    if not SENDER_PASSWORD:
        logger.error("GMAIL_APP_PASSWORD is not set in the environment variables.")
        return False
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your Password - Sub-ERP"
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email

        # Create a simple, clean HTML email
        # The frontend needs to route /reset-password?token=... 
        # For local development, assume localhost:5173 or the window origin
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #333333; margin-bottom: 20px;">Password Reset Request</h2>
                    <p style="color: #555555; line-height: 1.6;">Hello,</p>
                    <p style="color: #555555; line-height: 1.6;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                    <p style="color: #555555; line-height: 1.6;">To set a new password, click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #555555; line-height: 1.6; font-size: 0.9em;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="color: #2563eb; line-height: 1.6; font-size: 0.9em; word-break: break-all;">{reset_link}</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                    <p style="color: #9ca3af; font-size: 0.8em; text-align: center;">This link will expire in 1 hour.</p>
                </div>
            </body>
        </html>
        """
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        # Connect to Gmail SMTP server using SSL
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
            
        logger.info(f"Password reset email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        return False

def send_admin_approval_email(user_email: str, user_name: str, approval_token: str):
    if not SENDER_PASSWORD:
        logger.error("GMAIL_APP_PASSWORD is not set in the environment variables.")
        return False
        
    try:
        admin_email = "raihansheikh145@gmail.com"
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "New User Pending Approval - Sub-ERP"
        msg["From"] = SENDER_EMAIL
        msg["To"] = admin_email

        # Approval link explicitly points to backend port 3000 where Uvicorn is running
        approval_link = f"http://127.0.0.1:3000/api/auth/approve/{approval_token}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #333333; margin-bottom: 20px;">New Account Approval</h2>
                    <p style="color: #555555; line-height: 1.6;">Hello Admin,</p>
                    <p style="color: #555555; line-height: 1.6;">A new user has registered for Sub-ERP and is waiting for your approval to access the system.</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
                        <p style="margin: 5px 0;"><strong>Name:</strong> {user_name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> {user_email}</p>
                    </div>

                    <p style="color: #555555; line-height: 1.6;">To approve this user and grant them access, click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{approval_link}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Approve User</a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                    <p style="color: #9ca3af; font-size: 0.8em; text-align: center;">Sub-ERP Automated Notification System</p>
                </div>
            </body>
        </html>
        """
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, admin_email, msg.as_string())
            
        logger.info(f"Admin approval email sent successfully for {user_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send admin approval email: {str(e)}")
        return False
