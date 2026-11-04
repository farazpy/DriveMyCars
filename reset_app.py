import mysql.connector
import sys

# Configuration
DB_CONFIG = {
    'host': '74.208.133.80',
    'port': 3306,
    'user': 'drivemycarz',
    'password': 'Afrin#9492',
    'database': 'drivemycarz'
}

# Tables to truncate
TABLES = [
    'reviews',
    'bookings',
    'documents',
    'cars',
    'users',
    'platform_settings'
]

# Default settings to restore after reset
DEFAULT_SETTINGS = {
    'id': 'global',
    'brand_name': 'Charvi Rental',
    'brand_tagline': 'Self-Drive Fleet · India',
    'contact_email': 'operationalhtklabs@gmail.com',
    'contact_phone': '+91 98765 43210',
    'contact_address': 'Wakad, Pune, Maharashtra, India',
    'domain_name': 'charvirental.com',
    'support_hours': '24/7 Roadside & Concierge Support',
    'gst_number': '27AAACD1234F1Z5',
    'social_instagram': 'https://instagram.com/charvirental',
    'social_twitter': 'https://twitter.com/charvirental',
    'social_facebook': 'https://facebook.com/charvirental',
    'commission_rate': 10,
    'gst_rate': 18,
    'security_deposit_default': 3000,
    'min_booking_hours': 8,
    'default_km_limit': 300,
    'default_extra_km_rate': 12,
    'auto_approve_vehicles': 0, # False
    'auto_approve_hosts': 0 # False
}

def reset_database():
    connection = None
    try:
        print(f"🔗 Connecting to database '{DB_CONFIG['database']}' at {DB_CONFIG['host']}...")
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()

        # Disable foreign key checks to allow truncation in any order
        print("🔓 Disabling foreign key checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

        for table in TABLES:
            print(f"🧹 Resetting table: {table}...")
            cursor.execute(f"TRUNCATE TABLE {table};")
        
        # Re-enable foreign key checks
        print("🔒 Re-enabling foreign key checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

        # Restore default platform settings
        print("📝 Restoring default platform settings...")
        cols = ", ".join(DEFAULT_SETTINGS.keys())
        placeholders = ", ".join(["%s"] * len(DEFAULT_SETTINGS))
        sql = f"INSERT INTO platform_settings ({cols}) VALUES ({placeholders})"
        cursor.execute(sql, list(DEFAULT_SETTINGS.values()))

        connection.commit()
        print("\n✅ SUCCESS: Database has been reset to factory defaults.")

    except mysql.connector.Error as err:
        print(f"\n❌ ERROR: {err}")
        if connection:
            connection.rollback()
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 Connection closed.")

if __name__ == "__main__":
    confirm = input("⚠️ WARNING: This will DELETE all data (users, cars, bookings, reviews). Continue? (y/n): ")
    if confirm.lower() == 'y':
        reset_database()
    else:
        print("❌ Reset cancelled.")
