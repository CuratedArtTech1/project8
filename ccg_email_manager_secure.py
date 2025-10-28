#!/usr/bin/env python3
"""
CCG Email Manager - Secure Email Management with IMAP
This script manages email operations for CCG Art Loan System using secure IMAP connections.
"""

import imaplib
import email
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import smtplib
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class EmailConfig:
    """Configuration for email operations"""
    email: str
    password: str
    imap_server: str
    imap_port: int
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587


@dataclass
class EmailMessage:
    """Represents an email message"""
    subject: str
    sender: str
    recipient: str
    date: datetime
    body: str
    message_id: str
    has_attachments: bool = False


class CCGEmailManager:
    """
    Secure email manager for CCG Art Loan System.
    Handles IMAP connections for reading emails and SMTP for sending.
    """
    
    def __init__(self, config: EmailConfig):
        """
        Initialize the email manager with configuration.
        
        Args:
            config: EmailConfig object with credentials and server settings
        """
        self.config = config
        self.imap_connection: Optional[imaplib.IMAP4_SSL] = None
        self._connected = False
        
    def connect_imap(self) -> bool:
        """
        Establish secure IMAP connection.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            # Create SSL context for secure connection
            context = ssl.create_default_context()
            
            # Connect to IMAP server
            self.imap_connection = imaplib.IMAP4_SSL(
                self.config.imap_server,
                self.config.imap_port,
                ssl_context=context
            )
            
            # Login
            self.imap_connection.login(self.config.email, self.config.password)
            self._connected = True
            logger.info(f"Successfully connected to IMAP server: {self.config.imap_server}")
            return True
            
        except imaplib.IMAP4.error as e:
            logger.error(f"IMAP authentication failed: {e}")
            self._connected = False
            return False
        except Exception as e:
            logger.error(f"Failed to connect to IMAP server: {e}")
            self._connected = False
            return False
    
    def disconnect(self):
        """Close IMAP connection safely"""
        if self.imap_connection and self._connected:
            try:
                self.imap_connection.close()
                self.imap_connection.logout()
                logger.info("IMAP connection closed successfully")
            except Exception as e:
                logger.warning(f"Error while closing IMAP connection: {e}")
            finally:
                self._connected = False
                self.imap_connection = None
    
    def list_folders(self) -> List[str]:
        """
        List all available email folders.
        
        Returns:
            List of folder names
        """
        if not self._connected:
            if not self.connect_imap():
                return []
        
        try:
            status, folders = self.imap_connection.list()
            if status == 'OK':
                folder_list = []
                for folder in folders:
                    # Parse folder name from the response
                    folder_name = folder.decode().split('"/"')[-1].strip().strip('"')
                    folder_list.append(folder_name)
                return folder_list
        except Exception as e:
            logger.error(f"Error listing folders: {e}")
        
        return []
    
    def fetch_emails(
        self,
        folder: str = "INBOX",
        limit: int = 10,
        unread_only: bool = False
    ) -> List[EmailMessage]:
        """
        Fetch emails from specified folder.
        
        Args:
            folder: Email folder to fetch from (default: INBOX)
            limit: Maximum number of emails to fetch
            unread_only: If True, fetch only unread emails
            
        Returns:
            List of EmailMessage objects
        """
        if not self._connected:
            if not self.connect_imap():
                return []
        
        try:
            # Select the folder
            status, messages = self.imap_connection.select(folder, readonly=True)
            if status != 'OK':
                logger.error(f"Failed to select folder: {folder}")
                return []
            
            # Build search criteria
            search_criteria = "UNSEEN" if unread_only else "ALL"
            
            # Search for emails
            status, message_ids = self.imap_connection.search(None, search_criteria)
            if status != 'OK':
                logger.error("Failed to search emails")
                return []
            
            # Get list of message IDs
            id_list = message_ids[0].split()
            
            # Fetch most recent emails up to limit
            emails = []
            for msg_id in id_list[-limit:]:
                email_msg = self._fetch_single_email(msg_id)
                if email_msg:
                    emails.append(email_msg)
            
            return emails
            
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            return []
    
    def _fetch_single_email(self, msg_id: bytes) -> Optional[EmailMessage]:
        """
        Fetch a single email by message ID.
        
        Args:
            msg_id: Message ID bytes
            
        Returns:
            EmailMessage object or None
        """
        try:
            status, msg_data = self.imap_connection.fetch(msg_id, '(RFC822)')
            if status != 'OK':
                return None
            
            # Parse email
            raw_email = msg_data[0][1]
            email_message = email.message_from_bytes(raw_email)
            
            # Extract subject
            subject = email_message.get('Subject', 'No Subject')
            if subject:
                # Decode if needed
                decoded = email.header.decode_header(subject)
                subject = decoded[0][0]
                if isinstance(subject, bytes):
                    subject = subject.decode()
            
            # Extract body
            body = self._extract_body(email_message)
            
            # Extract date
            date_str = email_message.get('Date', '')
            try:
                date = email.utils.parsedate_to_datetime(date_str)
            except:
                date = datetime.now()
            
            # Check for attachments
            has_attachments = any(part.get_content_disposition() == 'attachment' 
                                 for part in email_message.walk())
            
            return EmailMessage(
                subject=subject,
                sender=email_message.get('From', ''),
                recipient=email_message.get('To', ''),
                date=date,
                body=body,
                message_id=email_message.get('Message-ID', ''),
                has_attachments=has_attachments
            )
            
        except Exception as e:
            logger.error(f"Error fetching single email: {e}")
            return None
    
    def _extract_body(self, email_message) -> str:
        """
        Extract email body from email message.
        
        Args:
            email_message: Email message object
            
        Returns:
            Email body as string
        """
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                # Get text/plain parts
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode()
                        break
                    except:
                        pass
        else:
            try:
                body = email_message.get_payload(decode=True).decode()
            except:
                body = str(email_message.get_payload())
        
        return body
    
    def send_email(
        self,
        to_address: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Tuple[str, bytes]]] = None
    ) -> bool:
        """
        Send an email via SMTP.
        
        Args:
            to_address: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
            attachments: Optional list of (filename, content) tuples
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.config.email
            msg['To'] = to_address
            msg['Subject'] = subject
            
            # Attach plain text
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Attach files if provided
            if attachments:
                for filename, content in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(content)
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {filename}'
                    )
                    msg.attach(part)
            
            # Send via SMTP
            context = ssl.create_default_context()
            with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.config.email, self.config.password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_address}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def search_emails(
        self,
        criteria: str,
        folder: str = "INBOX",
        limit: int = 10
    ) -> List[EmailMessage]:
        """
        Search emails based on IMAP search criteria.
        
        Args:
            criteria: IMAP search criteria (e.g., 'FROM "sender@example.com"')
            folder: Email folder to search in
            limit: Maximum number of results
            
        Returns:
            List of matching EmailMessage objects
        """
        if not self._connected:
            if not self.connect_imap():
                return []
        
        try:
            self.imap_connection.select(folder, readonly=True)
            status, message_ids = self.imap_connection.search(None, criteria)
            
            if status != 'OK':
                return []
            
            id_list = message_ids[0].split()
            emails = []
            
            for msg_id in id_list[-limit:]:
                email_msg = self._fetch_single_email(msg_id)
                if email_msg:
                    emails.append(email_msg)
            
            return emails
            
        except Exception as e:
            logger.error(f"Error searching emails: {e}")
            return []
    
    def __enter__(self):
        """Context manager entry"""
        self.connect_imap()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()


def load_config_from_streamlit() -> Optional[EmailConfig]:
    """
    Load email configuration from Streamlit secrets.
    
    Returns:
        EmailConfig object or None if streamlit is not available
    """
    try:
        import streamlit as st
        return EmailConfig(
            email=st.secrets["EMAIL"],
            password=st.secrets["EMAIL_PASSWORD"],
            imap_server=st.secrets["IMAP_SERVER"],
            imap_port=int(st.secrets["IMAP_PORT"])
        )
    except ImportError:
        logger.warning("Streamlit not available, cannot load secrets")
        return None
    except Exception as e:
        logger.error(f"Error loading Streamlit secrets: {e}")
        return None


def main():
    """
    Main function demonstrating email manager usage.
    """
    # Example usage with manual configuration
    config = EmailConfig(
        email="meghan@ccg-art.com",
        password="your_app_specific_password",
        imap_server="imap.gmail.com",
        imap_port=993
    )
    
    # Use context manager for automatic connection/disconnection
    with CCGEmailManager(config) as manager:
        # List folders
        print("Available folders:")
        folders = manager.list_folders()
        for folder in folders:
            print(f"  - {folder}")
        
        # Fetch recent emails
        print("\nRecent emails:")
        emails = manager.fetch_emails(limit=5)
        for email_msg in emails:
            print(f"  From: {email_msg.sender}")
            print(f"  Subject: {email_msg.subject}")
            print(f"  Date: {email_msg.date}")
            print(f"  Has attachments: {email_msg.has_attachments}")
            print("-" * 50)


if __name__ == "__main__":
    main()
