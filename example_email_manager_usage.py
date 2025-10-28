#!/usr/bin/env python3
"""
Example usage of CCG Email Manager
This script demonstrates how to use the email manager with Streamlit secrets.
"""

from ccg_email_manager_secure import CCGEmailManager, EmailConfig, load_config_from_streamlit
import sys


def main():
    """
    Example demonstrating email manager usage.
    """
    print("CCG Email Manager - Example Usage")
    print("=" * 50)
    
    # Try to load config from Streamlit secrets
    config = load_config_from_streamlit()
    
    # Fallback to manual config if Streamlit is not available
    if config is None:
        print("\nStreamlit not available. Using manual configuration.")
        print("Note: Update the password in .streamlit/secrets.toml for actual use.\n")
        
        config = EmailConfig(
            email="meghan@ccg-art.com",
            password="your_app_specific_password",  # Replace with actual password
            imap_server="imap.gmail.com",
            imap_port=993
        )
    
    # Example 1: List email folders
    print("\n1. Listing email folders:")
    print("-" * 50)
    try:
        with CCGEmailManager(config) as manager:
            folders = manager.list_folders()
            if folders:
                for folder in folders[:10]:  # Show first 10 folders
                    print(f"  📁 {folder}")
            else:
                print("  No folders found or connection failed.")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Example 2: Fetch recent emails
    print("\n2. Fetching recent emails from INBOX:")
    print("-" * 50)
    try:
        with CCGEmailManager(config) as manager:
            emails = manager.fetch_emails(folder="INBOX", limit=5)
            if emails:
                for i, email in enumerate(emails, 1):
                    print(f"\n  Email {i}:")
                    print(f"    From: {email.sender}")
                    print(f"    Subject: {email.subject}")
                    print(f"    Date: {email.date}")
                    print(f"    Has Attachments: {email.has_attachments}")
                    print(f"    Body preview: {email.body[:100]}...")
            else:
                print("  No emails found or connection failed.")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Example 3: Check for unread emails
    print("\n3. Checking for unread emails:")
    print("-" * 50)
    try:
        with CCGEmailManager(config) as manager:
            unread = manager.fetch_emails(folder="INBOX", unread_only=True, limit=3)
            if unread:
                print(f"  Found {len(unread)} unread email(s):")
                for email in unread:
                    print(f"    • {email.subject}")
            else:
                print("  No unread emails or connection failed.")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Example 4: Search emails
    print("\n4. Searching emails with specific criteria:")
    print("-" * 50)
    try:
        with CCGEmailManager(config) as manager:
            # Search for emails from a specific sender
            results = manager.search_emails(
                criteria='FROM "noreply@example.com"',
                folder="INBOX",
                limit=3
            )
            if results:
                print(f"  Found {len(results)} result(s):")
                for email in results:
                    print(f"    • {email.subject} ({email.date})")
            else:
                print("  No matching emails found.")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Example 5: Send email (commented out to prevent accidental sends)
    print("\n5. Send email example (not executed):")
    print("-" * 50)
    print("""
    # Uncomment to actually send an email:
    # with CCGEmailManager(config) as manager:
    #     success = manager.send_email(
    #         to_address="recipient@example.com",
    #         subject="Test Email from CCG Email Manager",
    #         body="This is a test email sent from the CCG Email Manager.",
    #         html_body="<p>This is a <strong>test email</strong> sent from the CCG Email Manager.</p>"
    #     )
    #     if success:
    #         print("  ✓ Email sent successfully!")
    #     else:
    #         print("  ✗ Failed to send email.")
    """)
    
    print("\n" + "=" * 50)
    print("Example completed!")
    print("\nTo run with real credentials:")
    print("1. Update .streamlit/secrets.toml with your Gmail app password")
    print("2. Run: python example_email_manager_usage.py")


if __name__ == "__main__":
    main()
