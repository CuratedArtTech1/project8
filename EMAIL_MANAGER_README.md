# CCG Email Manager

A secure email management system for CCG Art Loan System with IMAP/SMTP support.

## Features

- **Secure IMAP Connection**: Connect to email servers with SSL/TLS encryption
- **Email Fetching**: Retrieve emails from any folder (INBOX, Sent, etc.)
- **Email Sending**: Send emails via SMTP with attachment support
- **Email Search**: Search emails using IMAP search criteria
- **Streamlit Integration**: Load credentials from Streamlit secrets
- **Context Manager**: Automatic connection management with `with` statement

## Setup

### 1. Configure Credentials

Create a `.streamlit/secrets.toml` file with your email credentials:

```toml
EMAIL = "meghan@ccg-art.com"
EMAIL_PASSWORD = "your_app_specific_password"
IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993
```

**Important**: The `.streamlit/secrets.toml` file is ignored by git for security.

### 2. Gmail App Password

For Gmail accounts, you need to:
1. Enable 2-Step Verification in your Google Account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the generated 16-character password in `EMAIL_PASSWORD`

### 3. Python Dependencies

Install required Python packages:

```bash
pip install streamlit  # For secrets management (optional)
```

The script uses only Python standard library modules for email operations:
- `imaplib` - IMAP protocol
- `smtplib` - SMTP protocol
- `email` - Email parsing and construction
- `ssl` - Secure connections

## Usage

### Basic Example

```python
from ccg_email_manager_secure import CCGEmailManager, EmailConfig

# Configure email settings
config = EmailConfig(
    email="meghan@ccg-art.com",
    password="your_app_specific_password",
    imap_server="imap.gmail.com",
    imap_port=993
)

# Use context manager for automatic connection handling
with CCGEmailManager(config) as manager:
    # Fetch recent emails
    emails = manager.fetch_emails(limit=10)
    for email in emails:
        print(f"From: {email.sender}")
        print(f"Subject: {email.subject}")
        print(f"Date: {email.date}")
        print("-" * 50)
```

### Fetch Unread Emails

```python
with CCGEmailManager(config) as manager:
    unread = manager.fetch_emails(unread_only=True, limit=5)
    for email in unread:
        print(f"Unread: {email.subject}")
```

### Search Emails

```python
with CCGEmailManager(config) as manager:
    # Search by sender
    results = manager.search_emails('FROM "sender@example.com"')
    
    # Search by subject
    results = manager.search_emails('SUBJECT "loan statement"')
    
    # Search by date
    results = manager.search_emails('SINCE 01-Jan-2024')
```

### Send Email

```python
with CCGEmailManager(config) as manager:
    success = manager.send_email(
        to_address="recipient@example.com",
        subject="Loan Statement",
        body="Please find your loan statement attached.",
        html_body="<h1>Loan Statement</h1><p>Please find your statement attached.</p>",
        attachments=[
            ("statement.pdf", pdf_content_bytes)
        ]
    )
    if success:
        print("Email sent successfully")
```

### List Folders

```python
with CCGEmailManager(config) as manager:
    folders = manager.list_folders()
    for folder in folders:
        print(folder)
```

### Using with Streamlit Secrets

```python
from ccg_email_manager_secure import CCGEmailManager, load_config_from_streamlit

# Load configuration from Streamlit secrets
config = load_config_from_streamlit()

if config:
    with CCGEmailManager(config) as manager:
        emails = manager.fetch_emails(limit=5)
```

## Security Best Practices

1. **Never commit secrets**: The `.streamlit/secrets.toml` file is in `.gitignore`
2. **Use app passwords**: For Gmail, use app-specific passwords, not your main password
3. **SSL/TLS encryption**: All connections use secure SSL/TLS
4. **Read-only by default**: Email fetching uses read-only mode to prevent accidental modifications
5. **Logging**: The module logs operations for audit purposes (no sensitive data logged)

## API Reference

### EmailConfig

Configuration dataclass for email operations:
- `email`: Email address
- `password`: App-specific password or account password
- `imap_server`: IMAP server hostname
- `imap_port`: IMAP port (usually 993 for SSL)
- `smtp_server`: SMTP server hostname (default: "smtp.gmail.com")
- `smtp_port`: SMTP port (default: 587 for TLS)

### EmailMessage

Email message dataclass:
- `subject`: Email subject
- `sender`: Sender email address
- `recipient`: Recipient email address
- `date`: Email datetime
- `body`: Email body text
- `message_id`: Unique message identifier
- `has_attachments`: Boolean indicating if email has attachments

### CCGEmailManager Methods

- `connect_imap()`: Establish IMAP connection
- `disconnect()`: Close IMAP connection
- `list_folders()`: List all email folders
- `fetch_emails(folder, limit, unread_only)`: Fetch emails from folder
- `send_email(to_address, subject, body, html_body, attachments)`: Send email
- `search_emails(criteria, folder, limit)`: Search emails with IMAP criteria

## IMAP Search Criteria Examples

The `search_emails()` method supports standard IMAP search criteria:

- `ALL` - All messages
- `UNSEEN` - Unread messages
- `SEEN` - Read messages
- `FROM "email@example.com"` - From specific sender
- `TO "email@example.com"` - To specific recipient
- `SUBJECT "keyword"` - Subject contains keyword
- `BODY "keyword"` - Body contains keyword
- `SINCE 01-Jan-2024` - Messages since date
- `BEFORE 01-Jan-2024` - Messages before date
- `ON 01-Jan-2024` - Messages on specific date

Combine criteria with spaces:
```python
manager.search_emails('FROM "sender@example.com" SUBJECT "loan"')
```

## Integration with CCG Art Loan System

This email manager is designed to integrate with the CCG Art Loan System for:
- Sending automated loan statements
- Processing borrower communications
- Managing document requests
- Handling COI (Certificate of Insurance) notifications
- UCC filing reminders

## Error Handling

The module uses Python's logging system. Errors are logged but don't raise exceptions in most cases, allowing graceful degradation:

```python
import logging
logging.basicConfig(level=logging.DEBUG)  # Enable debug logs

with CCGEmailManager(config) as manager:
    # Operations will log errors but continue
    emails = manager.fetch_emails()
```

## Testing

Run the module directly to test basic functionality:

```bash
python ccg_email_manager_secure.py
```

This will attempt to connect and list folders (will fail without valid credentials, but demonstrates the interface).

## License

Part of the CCG Art Loan System. For internal use only.
