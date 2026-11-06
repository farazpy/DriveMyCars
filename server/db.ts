import mysql from 'mysql2/promise';
import {
  INITIAL_CARS,
  INITIAL_REVIEWS,
  INITIAL_USERS,
  INITIAL_DOCUMENTS,
  CarRecord,
  UserRecord,
  DocumentRecord
} from './seedData.ts';

// MySQL Configuration loaded from environment variables / AI Studio Secrets
// MySQL Configuration (Hardcoded as requested)
const DB_HOST = '13.140.210.131';
const DB_PORT = 3306;
const DB_USER = 'charvirentals';
const DB_PASSWORD = 'Afrin#9492';
const DB_NAME = 'charvirentals';

let pool: mysql.Pool | null = null;
let isConnected = false;
let connectionErrorMessage = '';
let lastError: any = null;

export interface PlatformSettings {
  id: string;
  brand_name: string;
  brand_tagline: string;
  logo_url: string;
  favicon_url?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  domain_name: string;
  support_hours: string;
  gst_number: string;
  social_instagram: string;
  social_twitter: string;
  social_facebook: string;
  commission_rate: number;
  gst_rate: number;
  security_deposit_default: number;
  min_booking_hours: number;
  default_km_limit: number;
  default_extra_km_rate: number;
  auto_approve_vehicles: boolean;
  auto_approve_hosts: boolean;
  available_cities?: string[]; // JSON string in DB, string[] in JS
  logo_dark_url?: string;
  favicon_png_96_url?: string;
  favicon_svg_url?: string;
  favicon_ico_url?: string;
  apple_touch_icon_url?: string;
  webmanifest_url?: string;
  updated_at?: string;
}

// In-memory fallback dataset for seamless offline operation
let memCars: CarRecord[] = [];
let memBookings: any[] = [];
let memUsers: Record<string, UserRecord> = {};
let memDocuments: DocumentRecord[] = [];
let memReviews: any[] = [];
let memSettings: PlatformSettings = {
  id: 'global',
  brand_name: 'Charvi Rental',
  brand_tagline: 'Self-Drive Fleet · India',
  logo_url: '',
  favicon_url: '',
  contact_email: 'operationalhtklabs@gmail.com',
  contact_phone: '+91 98765 43210',
  contact_address: 'Wakad, Pune, Maharashtra, India',
  domain_name: 'charvirental.com',
  support_hours: '24/7 Roadside & Concierge Support',
  gst_number: '27AAACD1234F1Z5',
  social_instagram: 'https://instagram.com/charvirental',
  social_twitter: 'https://twitter.com/charvirental',
  social_facebook: 'https://facebook.com/charvirental',
  commission_rate: 10,
  gst_rate: 18,
  security_deposit_default: 3000,
  min_booking_hours: 8,
  default_km_limit: 300,
  default_extra_km_rate: 12,
  auto_approve_vehicles: false,
  auto_approve_hosts: false,
  available_cities: ['Pune', 'Mumbai', 'Bangalore', 'Delhi NCR', 'Goa', 'Hyderabad'],
};

export async function initDatabase() {
  console.log(`[DB] Attempting MySQL connection to ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}...`);
  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
    });

    const testConn = await pool.getConnection();
    await testConn.ping();

    // 1. Users table
    await testConn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        google_id VARCHAR(128),
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar TEXT,
        role VARCHAR(50) DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'approved',
        phone VARCHAR(50),
        dob VARCHAR(50),
        gender VARCHAR(20),
        licence_number VARCHAR(100),
        licence_expiry VARCHAR(50),
        aadhaar_number VARCHAR(50),
        onboarded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Run alter table queries to add columns to existing users tables
    const columnsToMigration = [
      { name: 'dob', type: 'VARCHAR(50)' },
      { name: 'gender', type: 'VARCHAR(20)' },
      { name: 'licence_number', type: 'VARCHAR(100)' },
      { name: 'licence_expiry', type: 'VARCHAR(50)' },
      { name: 'aadhaar_number', type: 'VARCHAR(50)' },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'approved'" },
      { name: 'onboarded', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'google_id', type: 'VARCHAR(128)' },
      { name: 'bio', type: 'TEXT' },
      { name: 'password', type: 'VARCHAR(255)' },
      { name: 'location', type: 'VARCHAR(255)' },
      { name: 'address', type: 'VARCHAR(255)' }
    ];

    for (const col of columnsToMigration) {
      try {
        await testConn.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[DB] Successfully migrated column ${col.name} to users table.`);
      } catch (err: any) {
        // Ignored if column already exists (Error 1060 is Duplicate column name)
        if (err.errno !== 1060) {
          console.warn(`[DB] Column migration notice for ${col.name}:`, err.message);
        }
      }
    }

    // 2. Cars table with approval_status
    await testConn.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id VARCHAR(64) PRIMARY KEY,
        lender_id VARCHAR(128) NOT NULL,
        lender_name VARCHAR(255) NOT NULL,
        lender_avatar TEXT,
        title VARCHAR(255) NOT NULL,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        transmission VARCHAR(30) NOT NULL,
        fuel VARCHAR(50) NOT NULL,
        seats INT NOT NULL,
        price_per_day DECIMAL(10,2) NOT NULL,
        security_deposit DECIMAL(10,2) DEFAULT 0.00,
        location VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        image_url TEXT NOT NULL,
        images JSON,
        features JSON,
        rating DECIMAL(3,2) DEFAULT 5.0,
        reviews_count INT DEFAULT 0,
        is_instant_book BOOLEAN DEFAULT TRUE,
        is_available BOOLEAN DEFAULT TRUE,
        approval_status VARCHAR(50) DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Run alter table queries to add columns to existing cars table without modifying existing data
    const carColsToMigrate = [
      { name: 'approval_status', type: "VARCHAR(50) DEFAULT 'approved'" },
      { name: 'security_deposit', type: "DECIMAL(10,2) DEFAULT 0.00" },
      { name: 'service_radius', type: "INT DEFAULT 4" },
      { name: 'hub_lat', type: "DECIMAL(10, 7) DEFAULT 18.5204" },
      { name: 'hub_lng', type: "DECIMAL(10, 7) DEFAULT 73.8567" },
      { name: 'hub_area', type: "VARCHAR(150)" },
      { name: 'reg_number', type: "VARCHAR(50)" },
      { name: 'description', type: "TEXT" },
      { name: 'seo_title', type: "VARCHAR(255)" },
      { name: 'seo_description', type: "TEXT" },
      { name: 'mileage', type: "VARCHAR(50) DEFAULT '16 km/l'" },
      { name: 'km_limit', type: "INT DEFAULT 300" },
      { name: 'extra_km_rate', type: "DECIMAL(10, 2) DEFAULT 12.00" },
      { name: 'blackout_dates', type: "JSON" },
      { name: 'lender_phone', type: "VARCHAR(50)" }
    ];

    for (const col of carColsToMigrate) {
      try {
        await testConn.query(`ALTER TABLE cars ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[DB] Successfully migrated column ${col.name} to cars table.`);
      } catch (err: any) {
        if (err.errno !== 1060) {
          console.warn(`[DB] Column migration notice for cars.${col.name}:`, err.message);
        }
      }
    }

    // 3. Bookings table
    await testConn.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(64) PRIMARY KEY,
        car_id VARCHAR(64) NOT NULL,
        car_title VARCHAR(255),
        car_image TEXT,
        renter_id VARCHAR(128) NOT NULL,
        renter_name VARCHAR(255) NOT NULL,
        renter_email VARCHAR(255) NOT NULL,
        lender_id VARCHAR(128) NOT NULL,
        pickup_datetime VARCHAR(100) NOT NULL,
        dropoff_datetime VARCHAR(100) NOT NULL,
        total_days INT NOT NULL,
        price_per_day DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        insurance_plan VARCHAR(50) DEFAULT 'Standard',
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const bookingColsToMigrate = [
      { name: 'start_odometer', type: 'INT' },
      { name: 'end_odometer', type: 'INT' },
      { name: 'fuel_level', type: 'VARCHAR(50)' },
      { name: 'handover_status', type: "VARCHAR(50) DEFAULT 'pending'" },
      { name: 'handover_notes', type: 'TEXT' },
      { name: 'extra_km_charge', type: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'platform_commission', type: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'net_lender_payout', type: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'payout_status', type: "VARCHAR(50) DEFAULT 'pending'" },
      { name: 'dispute_status', type: "VARCHAR(50) DEFAULT 'none'" },
      { name: 'dispute_notes', type: 'TEXT' },
      { name: 'cancellation_reason', type: 'TEXT' }
    ];

    for (const col of bookingColsToMigrate) {
      try {
        await testConn.query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[DB] Successfully migrated column ${col.name} to bookings table.`);
      } catch (err: any) {
        if (err.errno !== 1060) {
          console.warn(`[DB] Column migration notice for bookings.${col.name}:`, err.message);
        }
      }
    }

    // 4. Documents table
    await testConn.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        doc_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'verified',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Reviews table
    await testConn.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(64) PRIMARY KEY,
        car_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_avatar TEXT,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Platform Settings & Brand Governance table
    await testConn.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(64) PRIMARY KEY,
        brand_name VARCHAR(255) DEFAULT 'Charvi Rental',
        brand_tagline VARCHAR(255) DEFAULT 'Self-Drive Fleet · India',
        logo_url TEXT,
        contact_email VARCHAR(255) DEFAULT 'operationalhtklabs@gmail.com',
        contact_phone VARCHAR(50) DEFAULT '+91 98765 43210',
        contact_address VARCHAR(255) DEFAULT 'Wakad, Pune, Maharashtra, India',
        domain_name VARCHAR(255) DEFAULT 'charvirental.com',
        support_hours VARCHAR(255) DEFAULT '24/7 Roadside & Concierge Support',
        gst_number VARCHAR(100) DEFAULT '27AAACD1234F1Z5',
        social_instagram VARCHAR(255) DEFAULT 'https://instagram.com/charvirental',
        social_twitter VARCHAR(255) DEFAULT 'https://twitter.com/charvirental',
        social_facebook VARCHAR(255) DEFAULT 'https://facebook.com/charvirental',
        available_cities JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migration: ensure new site config columns exist
    const newSettingsCols = [
      { name: 'logo_url', type: 'TEXT' },
      { name: 'logo_dark_url', type: 'TEXT' },
      { name: 'favicon_url', type: 'TEXT' },
      { name: 'favicon_png_96_url', type: 'TEXT' },
      { name: 'favicon_svg_url', type: 'TEXT' },
      { name: 'favicon_ico_url', type: 'TEXT' },
      { name: 'apple_touch_icon_url', type: 'TEXT' },
      { name: 'webmanifest_url', type: 'TEXT' },
      { name: 'commission_rate', type: 'DECIMAL(5,2) DEFAULT 10.00' },
      { name: 'gst_rate', type: 'DECIMAL(5,2) DEFAULT 18.00' },
      { name: 'security_deposit_default', type: 'DECIMAL(10,2) DEFAULT 3000.00' },
      { name: 'min_booking_hours', type: 'INT DEFAULT 8' },
      { name: 'default_km_limit', type: 'INT DEFAULT 300' },
      { name: 'default_extra_km_rate', type: 'DECIMAL(6,2) DEFAULT 12.00' },
      { name: 'auto_approve_vehicles', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'auto_approve_hosts', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'available_cities', type: 'JSON' },
    ];
    for (const col of newSettingsCols) {
      try {
        await testConn.query(`ALTER TABLE platform_settings ADD COLUMN \`${col.name}\` ${col.type}`);
      } catch {
        // column already exists, safe to ignore
      }
    }

    await testConn.query(`
      INSERT IGNORE INTO platform_settings (id, brand_name, brand_tagline, logo_url, contact_email, contact_phone, contact_address, domain_name, support_hours, gst_number, available_cities)
      VALUES ('global', 'Charvi Rental', 'Self-Drive Fleet · India', '', 'operationalhtklabs@gmail.com', '+91 98765 43210', 'Wakad, Pune, Maharashtra, India', 'charvirental.com', '24/7 Roadside & Concierge Support', '27AAACD1234F1Z5', '["Pune", "Mumbai", "Bangalore", "Delhi NCR", "Goa", "Hyderabad"]');
    `);

    // Ensure brand name is updated if it was previously default DriveMyCarz
    try {
      await testConn.query(`UPDATE platform_settings SET brand_name = 'Charvi Rental' WHERE (brand_name = 'DriveMyCarz' OR brand_name IS NULL OR brand_name = '') AND id = 'global'`);
    } catch {}

    testConn.release();
    isConnected = true;
    connectionErrorMessage = '';
    console.log(`[DB] Connected to MySQL: ${DB_NAME} at ${DB_HOST}:${DB_PORT}`);
  } catch (error: any) {
    isConnected = false;
    lastError = error;
    connectionErrorMessage = error.message || 'Unable to connect to MySQL';
    console.warn(`[DB] Operational storage active (${connectionErrorMessage})`);
  }
}

function getErrorSolutions(err: any): string[] {
  if (!err) return [];
  const solutions: string[] = [];
  const code = err.code || '';
  
  if (code === 'ECONNREFUSED') {
    solutions.push('Verify MySQL server is running on the host and port specified.');
    solutions.push('Check if a firewall is blocking port 3306 on the database server.');
  } else if (code === 'ER_ACCESS_DENIED_ERROR') {
    solutions.push('Double-check the DB_USER and DB_PASSWORD strings in server/db.ts.');
    solutions.push('Ensure the MySQL user has permissions to connect from the AI Studio host IP.');
    solutions.push('Try running: GRANT ALL PRIVILEGES ON charvirentals.* TO \'charvirentals\'@\'%\';');
  } else if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    solutions.push('The database host address is unreachable. Check for typos or DNS issues.');
  } else if (code === 'ETIMEDOUT') {
    solutions.push('The connection timed out. Check network stability or server load.');
  } else if (code === 'ER_BAD_DB_ERROR') {
    solutions.push(`The database "${DB_NAME}" does not exist and the user might not have CREATE permissions.`);
  }

  solutions.push('Note: Remote MySQL servers often require the connecting IP to be whitelisted.');
  return solutions;
}

export function getDbStatus() {
  return {
    connected: isConnected,
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
    message: isConnected
      ? `System Active (${DB_HOST}:${DB_PORT}/${DB_NAME})`
      : connectionErrorMessage || `Operational local store active.`,
    error: lastError ? {
      code: lastError.code,
      message: lastError.message,
      errno: lastError.errno,
      sqlState: lastError.sqlState
    } : null,
    solutions: getErrorSolutions(lastError),
    stats: {
      cars: memCars.length,
      bookings: memBookings.length,
      users: Object.keys(memUsers).length,
    }
  };
}

// User Sync with Existing Account Email Matching & Role Preservation
export async function syncUser(userData: {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'customer' | 'lender' | 'admin' | 'renter';
  phone?: string;
  dob?: string;
  gender?: string;
  licence_number?: string;
  licence_expiry?: string;
  aadhaar_number?: string;
  location?: string;
  address?: string;
  bio?: string;
  onboarded?: boolean;
}) {
  let existing: UserRecord | null = null;

  // 1. Direct ID lookup in memory
  if (memUsers[userData.id]) {
    existing = memUsers[userData.id];
  }

  // 2. Email lookup in memory if not found by ID
  if (!existing && userData.email) {
    const matchedByEmail = Object.values(memUsers).find(
      (u) => u.email && u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (matchedByEmail) {
      existing = matchedByEmail;
    }
  }

  // 3. Email lookup in MySQL database
  if (isConnected && pool && userData.email) {
    try {
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR id = ?',
        [userData.email, userData.id]
      );
      if (rows.length > 0) {
        const dbMatched = rows[0];
        existing = {
          ...dbMatched,
          onboarded: Boolean(dbMatched.onboarded),
        };
      }
    } catch (err) {
      console.error('[DB] Error querying user by email during sync:', err);
    }
  }

  const normalizedEmail = (userData.email || existing?.email || '').toLowerCase();
  const isAdminEmail =
    normalizedEmail === 'farazxs16@gmail.com' ||
    normalizedEmail === 'operationalhtklabs@gmail.com';

  // Role determination: Preserve existing user's registered role in DB/Memory!
  let roleToSet: string = 'customer';
  if (isAdminEmail) {
    roleToSet = 'admin';
  } else if (existing?.role) {
    roleToSet = existing.role;
  } else if (userData.role && userData.role !== 'renter') {
    roleToSet = userData.role === 'customer' ? 'customer' : userData.role;
  }

  // Keep primary ID from existing user or use provided UID
  const targetId = existing?.id || userData.id;

  const updatedUser: UserRecord = {
    id: targetId,
    google_id: userData.id || existing?.google_id || targetId,
    email: userData.email || existing?.email || '',
    name: userData.name || existing?.name || 'Verified User',
    avatar: userData.avatar || existing?.avatar || '',
    role: roleToSet as any,
    status: existing?.status || 'approved',
    phone: userData.phone !== undefined ? userData.phone : existing?.phone,
    dob: userData.dob !== undefined ? userData.dob : existing?.dob,
    gender: userData.gender !== undefined ? userData.gender : existing?.gender,
    licence_number: userData.licence_number !== undefined ? userData.licence_number : existing?.licence_number,
    licence_expiry: userData.licence_expiry !== undefined ? userData.licence_expiry : existing?.licence_expiry,
    aadhaar_number: userData.aadhaar_number !== undefined ? userData.aadhaar_number : existing?.aadhaar_number,
    location: userData.location !== undefined ? userData.location : existing?.location,
    address: userData.address !== undefined ? userData.address : existing?.address,
    bio: userData.bio !== undefined ? userData.bio : existing?.bio,
    onboarded: userData.onboarded !== undefined ? Boolean(userData.onboarded) : (existing?.onboarded || false),
    created_at: existing?.created_at || new Date().toISOString(),
  };

  // Map both primary user ID and incoming Google UID in memory for fast lookup
  memUsers[targetId] = updatedUser;
  if (userData.id && userData.id !== targetId) {
    memUsers[userData.id] = updatedUser;
  }

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO users (id, google_id, email, name, avatar, role, status, phone, dob, gender, licence_number, licence_expiry, aadhaar_number, onboarded, location, address, bio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         google_id = VALUES(google_id),
         name = VALUES(name),
         avatar = COALESCE(VALUES(avatar), avatar),
         role = VALUES(role),
         phone = COALESCE(VALUES(phone), phone),
         dob = COALESCE(VALUES(dob), dob),
         gender = COALESCE(VALUES(gender), gender),
         licence_number = COALESCE(VALUES(licence_number), licence_number),
         licence_expiry = COALESCE(VALUES(licence_expiry), licence_expiry),
         aadhaar_number = COALESCE(VALUES(aadhaar_number), aadhaar_number),
         onboarded = VALUES(onboarded),
         location = COALESCE(VALUES(location), location),
         address = COALESCE(VALUES(address), address),
         bio = COALESCE(VALUES(bio), bio)`,
        [
          updatedUser.id,
          updatedUser.google_id,
          updatedUser.email,
          updatedUser.name,
          updatedUser.avatar,
          updatedUser.role,
          updatedUser.status,
          updatedUser.phone || null,
          updatedUser.dob || null,
          updatedUser.gender || null,
          updatedUser.licence_number || null,
          updatedUser.licence_expiry || null,
          updatedUser.aadhaar_number || null,
          updatedUser.onboarded ? 1 : 0,
          updatedUser.location || null,
          updatedUser.address || null,
          updatedUser.bio || null,
        ]
      );
    } catch (err) {
      console.error('[DB] Error syncing user to MySQL:', err);
    }
  }

  return updatedUser;
}

export async function getUser(id: string) {
  if (isConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length > 0) {
        const u = rows[0];
        return {
          ...u,
          onboarded: Boolean(u.onboarded),
        };
      }
    } catch (err) {
      console.error('[DB] Error fetching user:', err);
    }
  }
  return memUsers[id] || null;
}

export async function updateUserProfile(id: string, updates: Partial<UserRecord>) {
  const existing = memUsers[id] || {
    id,
    google_id: id,
    email: updates.email || '',
    name: updates.name || 'Verified Host',
    avatar: updates.avatar || '',
    role: 'lender',
    status: 'approved',
    created_at: new Date().toISOString(),
  };

  const updated: UserRecord = {
    ...existing,
    ...updates,
    id,
  };

  memUsers[id] = updated;

  // Sync memCars lender avatar & name
  if (updates.avatar !== undefined || updates.name !== undefined) {
    memCars.forEach((c) => {
      if (c.lender_id === id || c.lender_id === existing.google_id) {
        if (updates.avatar !== undefined && updates.avatar !== '') c.lender_avatar = updates.avatar;
        if (updates.name !== undefined && updates.name !== '') c.lender_name = updates.name;
      }
    });
  }

  if (isConnected && pool) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
      if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
      if (updates.avatar !== undefined) { fields.push('avatar = ?'); values.push(updates.avatar); }
      if (updates.bio !== undefined) { fields.push('bio = ?'); values.push(updates.bio); }
      if (updates.password !== undefined) { fields.push('password = ?'); values.push(updates.password); }
      if (updates.dob !== undefined) { fields.push('dob = ?'); values.push(updates.dob); }
      if (updates.gender !== undefined) { fields.push('gender = ?'); values.push(updates.gender); }
      if (updates.licence_number !== undefined) { fields.push('licence_number = ?'); values.push(updates.licence_number); }
      if (updates.licence_expiry !== undefined) { fields.push('licence_expiry = ?'); values.push(updates.licence_expiry); }
      if (updates.aadhaar_number !== undefined) { fields.push('aadhaar_number = ?'); values.push(updates.aadhaar_number); }
      if (updates.location !== undefined) { fields.push('location = ?'); values.push(updates.location); }
      if (updates.address !== undefined) { fields.push('address = ?'); values.push(updates.address); }

      if (fields.length > 0) {
        values.push(id);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
      }

      // Sync cars table so lender_avatar is in sync
      if (updates.avatar !== undefined || updates.name !== undefined) {
        const carFields: string[] = [];
        const carVals: any[] = [];
        if (updates.avatar !== undefined) { carFields.push('lender_avatar = ?'); carVals.push(updates.avatar); }
        if (updates.name !== undefined) { carFields.push('lender_name = ?'); carVals.push(updates.name); }
        if (carFields.length > 0) {
          carVals.push(id, id);
          await pool.query(
            `UPDATE cars SET ${carFields.join(', ')} WHERE lender_id = ? OR lender_id = (SELECT google_id FROM users WHERE id = ? LIMIT 1)`,
            carVals
          );
        }
      }
    } catch (err) {
      console.error('[DB] Error updating user profile:', err);
    }
  }

  return updated;
}

export async function deleteAccountAndData(userId: string) {
  // 1. Memory Cleanup
  const user = memUsers[userId] || Object.values(memUsers).find(u => u.id === userId || u.google_id === userId);
  const targetId = user?.id || userId;
  const userEmail = user?.email?.toLowerCase();

  // Delete from memUsers
  Object.keys(memUsers).forEach((key) => {
    if (
      memUsers[key].id === targetId ||
      memUsers[key].id === userId ||
      (userEmail && memUsers[key].email?.toLowerCase() === userEmail)
    ) {
      delete memUsers[key];
    }
  });

  // Delete user's cars from memCars
  memCars = memCars.filter((c) => c.lender_id !== targetId && c.lender_id !== userId);

  // Delete user's bookings from memBookings
  memBookings = memBookings.filter(
    (b) =>
      b.renter_id !== targetId &&
      b.renter_id !== userId &&
      b.lender_id !== targetId &&
      b.lender_id !== userId
  );

  // Delete user's documents from memDocuments
  memDocuments = memDocuments.filter((d) => d.user_id !== targetId && d.user_id !== userId);

  // Delete user's reviews from memReviews
  memReviews = memReviews.filter((r) => r.user_id !== targetId && r.user_id !== userId);

  // 2. MySQL Database Cleanup
  if (isConnected && pool) {
    try {
      await pool.query('DELETE FROM documents WHERE user_id = ? OR user_id = ?', [targetId, userId]);
      await pool.query('DELETE FROM reviews WHERE user_id = ? OR user_id = ?', [targetId, userId]);
      await pool.query(
        'DELETE FROM bookings WHERE renter_id = ? OR lender_id = ? OR renter_id = ? OR lender_id = ?',
        [targetId, targetId, userId, userId]
      );
      await pool.query('DELETE FROM cars WHERE lender_id = ? OR lender_id = ?', [targetId, userId]);
      if (userEmail) {
        await pool.query('DELETE FROM users WHERE id = ? OR id = ? OR LOWER(email) = ?', [
          targetId,
          userId,
          userEmail,
        ]);
      } else {
        await pool.query('DELETE FROM users WHERE id = ? OR id = ?', [targetId, userId]);
      }
      console.log(
        `[DB] Successfully purged account and all relational data for user: ${targetId} (${userEmail || userId})`
      );
    } catch (err) {
      console.error('[DB] Error deleting user data from MySQL:', err);
      throw err;
    }
  }

  return { success: true, message: 'Account and associated data deleted permanently.' };
}

// Cars Query: ONLY approved cars are returned for the public website
export async function getCars(filters: {
  pickup?: string;
  dropoff?: string;
  location?: string;
  type?: string;
  transmission?: string;
  fuel?: string;
  seats?: number;
  minPrice?: number;
  maxPrice?: number;
  instantBook?: boolean;
  lenderId?: string;
  includeAllApprovalStatuses?: boolean;
}) {
  if (isConnected && pool) {
    try {
      let query = `
        SELECT 
          c.*, 
          COALESCE(NULLIF(u.avatar, ''), c.lender_avatar) AS lender_avatar,
          COALESCE(NULLIF(u.name, ''), c.lender_name) AS lender_name
        FROM cars c
        LEFT JOIN users u ON (c.lender_id = u.id OR c.lender_id = u.google_id)
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters.lenderId) {
        query += ' AND c.lender_id = ?';
        params.push(filters.lenderId);
      } else if (!filters.includeAllApprovalStatuses) {
        // Public website MUST only see approved cars!
        query += " AND c.is_available = 1 AND c.approval_status = 'approved'";
      }

      if (filters.pickup && filters.dropoff) {
        query += ` AND c.id NOT IN (
          SELECT DISTINCT car_id FROM bookings 
          WHERE status = 'confirmed' AND pickup_datetime < ? AND dropoff_datetime > ?
        )`;
        params.push(filters.dropoff, filters.pickup);
      }

      if (filters.location) {
        const keywords = filters.location.toLowerCase().split(/[ ,]+/).filter(k => k.length >= 3);
        if (keywords.length > 0) {
          const subclauses: string[] = [];
          keywords.forEach(kw => {
            subclauses.push('(LOWER(c.location) LIKE ? OR LOWER(c.city) LIKE ? OR LOWER(c.title) LIKE ?)');
            const kwTerm = `%${kw}%`;
            params.push(kwTerm, kwTerm, kwTerm);
          });
          query += ` AND (${subclauses.join(' OR ')})`;
        } else {
          query += ' AND (LOWER(c.location) LIKE ? OR LOWER(c.city) LIKE ? OR LOWER(c.title) LIKE ?)';
          const term = `%${filters.location.toLowerCase()}%`;
          params.push(term, term, term);
        }
      }

      if (filters.type && filters.type !== 'All') {
        query += ' AND c.type = ?';
        params.push(filters.type);
      }

      if (filters.transmission && filters.transmission !== 'All') {
        query += ' AND c.transmission = ?';
        params.push(filters.transmission);
      }

      if (filters.fuel && filters.fuel !== 'All') {
        query += ' AND c.fuel = ?';
        params.push(filters.fuel);
      }

      if (filters.seats) {
        query += ' AND c.seats >= ?';
        params.push(filters.seats);
      }

      if (filters.minPrice) {
        query += ' AND c.price_per_day >= ?';
        params.push(filters.minPrice);
      }

      if (filters.maxPrice) {
        query += ' AND c.price_per_day <= ?';
        params.push(filters.maxPrice);
      }

      if (filters.instantBook) {
        query += ' AND c.is_instant_book = 1';
      }

      query += ' ORDER BY c.rating DESC, c.created_at DESC';

      const [rows]: [any[], any] = await pool.query(query, params);
      let parsedCars: CarRecord[] = rows.map((r: any) => ({
        ...r,
        price_per_day: Number(r.price_per_day),
        security_deposit: Number(r.security_deposit || 0),
        rating: Number(r.rating),
        reviews_count: Number(r.reviews_count),
        is_instant_book: Boolean(r.is_instant_book),
        is_available: Boolean(r.is_available),
        approval_status: r.approval_status || 'approved',
        images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images || [r.image_url],
        features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features || [],
        blackout_dates: typeof r.blackout_dates === 'string' ? JSON.parse(r.blackout_dates) : r.blackout_dates || [],
      }));

      // Filter out cars whose blackout_dates fall within requested pickup..dropoff window on public searches
      if (!filters.lenderId && !filters.includeAllApprovalStatuses && filters.pickup && filters.dropoff) {
        const startDay = filters.pickup.split('T')[0];
        const endDay = filters.dropoff.split('T')[0];
        parsedCars = parsedCars.filter(c => {
          const blocked = c.blackout_dates || [];
          return !blocked.some(d => d >= startDay && d <= endDay);
        });
      }

      return parsedCars;
    } catch (err) {
      console.error('[DB] Error querying cars from MySQL:', err);
    }
  }

  // Memory fallback
  let result = [...memCars].map((c) => {
    const host = memUsers[c.lender_id] || Object.values(memUsers).find((u) => u.id === c.lender_id || u.google_id === c.lender_id);
    if (host) {
      return {
        ...c,
        lender_avatar: host.avatar || c.lender_avatar,
        lender_name: host.name || c.lender_name,
      };
    }
    return c;
  });

  if (filters.lenderId) {
    result = result.filter(c => c.lender_id === filters.lenderId);
  } else if (!filters.includeAllApprovalStatuses) {
    // Only approved cars on public site
    result = result.filter(c => c.is_available && c.approval_status === 'approved');
  }

  if (filters.location) {
    const term = filters.location.toLowerCase();
    const keywords = term.split(/[ ,]+/).filter(k => k.length >= 3);
    result = result.filter(c => {
      const matchFull = c.location.toLowerCase().includes(term) ||
             c.city.toLowerCase().includes(term) ||
             c.title.toLowerCase().includes(term);
      if (matchFull) return true;
      
      return keywords.some(kw => 
        c.location.toLowerCase().includes(kw) || 
        c.city.toLowerCase().includes(kw) || 
        c.title.toLowerCase().includes(kw)
      );
    });
  }

  if (filters.type && filters.type !== 'All') {
    result = result.filter(c => c.type.toLowerCase() === filters.type!.toLowerCase());
  }

  if (filters.transmission && filters.transmission !== 'All') {
    result = result.filter(c => c.transmission.toLowerCase() === filters.transmission!.toLowerCase());
  }

  if (filters.seats) {
    result = result.filter(c => c.seats >= filters.seats!);
  }

  if (filters.minPrice) {
    result = result.filter(c => c.price_per_day >= filters.minPrice!);
  }

  if (filters.maxPrice) {
    result = result.filter(c => c.price_per_day <= filters.maxPrice!);
  }

  if (filters.instantBook) {
    result = result.filter(c => c.is_instant_book);
  }

  if (filters.pickup && filters.dropoff) {
    const searchPickup = filters.pickup;
    const searchDropoff = filters.dropoff;
    const bookedCarIds = memBookings
      .filter(b => b.status === 'confirmed' && b.pickup_datetime < searchDropoff && b.dropoff_datetime > searchPickup)
      .map(b => b.car_id);
    result = result.filter(c => !bookedCarIds.includes(c.id));
  }

  return result;
}

export async function getCarById(id: string) {
  if (isConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query(
        `SELECT 
          c.*, 
          COALESCE(NULLIF(u.avatar, ''), c.lender_avatar) AS lender_avatar,
          COALESCE(NULLIF(u.name, ''), c.lender_name) AS lender_name
        FROM cars c
        LEFT JOIN users u ON (c.lender_id = u.id OR c.lender_id = u.google_id)
        WHERE c.id = ?`,
        [id]
      );
      if (rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          price_per_day: Number(r.price_per_day),
          security_deposit: Number(r.security_deposit || 0),
          rating: Number(r.rating),
          reviews_count: Number(r.reviews_count),
          is_instant_book: Boolean(r.is_instant_book),
          is_available: Boolean(r.is_available),
          approval_status: r.approval_status || 'approved',
          images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images || [r.image_url],
          features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features || [],
          blackout_dates: typeof r.blackout_dates === 'string' ? JSON.parse(r.blackout_dates) : r.blackout_dates || [],
        };
      }
    } catch (err) {
      console.error('[DB] Error getting car by ID:', err);
    }
  }

  const car = memCars.find(c => c.id === id);
  if (car) {
    const host = memUsers[car.lender_id] || Object.values(memUsers).find(u => u.id === car.lender_id || u.google_id === car.lender_id);
    if (host) {
      return {
        ...car,
        lender_avatar: host.avatar || car.lender_avatar,
        lender_name: host.name || car.lender_name,
      };
    }
  }
  return car || null;
}

// When a lender creates a car, it defaults to 'pending' approval so Admin approves it first!
export async function createCar(carData: Omit<CarRecord, 'id' | 'rating' | 'reviews_count' | 'created_at'>) {
  const newCar: CarRecord = {
    ...carData,
    id: `car-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    rating: 5.0,
    reviews_count: 0,
    approval_status: carData.approval_status || 'pending', // Pending Admin review!
    reg_number: carData.reg_number || '',
    service_radius: carData.service_radius || 4,
    hub_lat: carData.hub_lat || 18.5204,
    hub_lng: carData.hub_lng || 73.8567,
    hub_area: carData.hub_area || '',
    description: carData.description || '',
    seo_title: carData.seo_title || '',
    seo_description: carData.seo_description || '',
    mileage: carData.mileage || '16 km/l',
    km_limit: carData.km_limit || 300,
    extra_km_rate: carData.extra_km_rate || 12,
    created_at: new Date().toISOString(),
  };

  memCars.unshift(newCar);

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO cars (
          id, lender_id, lender_name, lender_avatar, title, make, model, year,
          type, transmission, fuel, seats, price_per_day, security_deposit, location, city,
          image_url, images, features, rating, reviews_count, is_instant_book, is_available, approval_status,
          reg_number, service_radius, hub_lat, hub_lng, hub_area, description, seo_title, seo_description, mileage, km_limit, extra_km_rate, lender_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newCar.id,
          newCar.lender_id,
          newCar.lender_name,
          newCar.lender_avatar,
          newCar.title,
          newCar.make,
          newCar.model,
          newCar.year,
          newCar.type,
          newCar.transmission,
          newCar.fuel,
          newCar.seats,
          newCar.price_per_day,
          newCar.security_deposit || 0,
          newCar.location,
          newCar.city,
          newCar.image_url,
          JSON.stringify(newCar.images),
          JSON.stringify(newCar.features),
          newCar.rating,
          newCar.reviews_count,
          newCar.is_instant_book ? 1 : 0,
          newCar.is_available ? 1 : 0,
          newCar.approval_status,
          newCar.reg_number,
          newCar.service_radius,
          newCar.hub_lat,
          newCar.hub_lng,
          newCar.hub_area,
          newCar.description,
          newCar.seo_title,
          newCar.seo_description,
          newCar.mileage,
          newCar.km_limit,
          newCar.extra_km_rate,
          newCar.lender_phone || null,
        ]
      );
    } catch (err) {
      console.error('[DB] Error inserting car into MySQL:', err);
    }
  }

  return newCar;
}

export async function updateCar(id: string, updates: Partial<CarRecord>) {
  const index = memCars.findIndex(c => c.id === id);
  if (index !== -1) {
    memCars[index] = { ...memCars[index], ...updates };
  }

  if (isConnected && pool) {
    try {
      const allowedKeys = [
        'title', 'make', 'model', 'year', 'type', 'transmission', 'fuel', 'seats',
        'price_per_day', 'security_deposit', 'location', 'city', 'image_url', 'images',
        'features', 'is_instant_book', 'is_available', 'approval_status', 'reg_number',
        'service_radius', 'hub_lat', 'hub_lng', 'hub_area', 'description', 'seo_title',
        'seo_description', 'mileage', 'km_limit', 'extra_km_rate', 'blackout_dates', 'lender_phone'
      ];
      const setClauses: string[] = [];
      const values: any[] = [];

      for (const [key, val] of Object.entries(updates)) {
        if (allowedKeys.includes(key)) {
          setClauses.push(`\`${key}\` = ?`);
          if ((key === 'images' || key === 'features' || key === 'blackout_dates') && Array.isArray(val)) {
            values.push(JSON.stringify(val));
          } else if (key === 'is_instant_book' || key === 'is_available') {
            values.push(val ? 1 : 0);
          } else {
            values.push(val === undefined ? null : val);
          }
        }
      }

      if (setClauses.length > 0) {
        values.push(id);
        await pool.query(`UPDATE cars SET ${setClauses.join(', ')} WHERE id = ?`, values);
      }
    } catch (err) {
      console.error('[DB] Error updating car in MySQL:', err);
    }
  }

  return memCars.find(c => c.id === id) || null;
}

export async function deleteCar(id: string) {
  memCars = memCars.filter(c => c.id !== id);

  if (isConnected && pool) {
    try {
      await pool.query('DELETE FROM cars WHERE id = ?', [id]);
    } catch (err) {
      console.error('[DB] Error deleting car:', err);
    }
  }

  return true;
}

// Admin: Update Car Approval Status
export async function setCarApprovalStatus(id: string, approval_status: 'approved' | 'rejected') {
  return updateCar(id, { approval_status });
}

// Admin: Update Lender Account Approval Status
export async function setLenderApprovalStatus(id: string, status: 'approved' | 'rejected') {
  if (memUsers[id]) {
    memUsers[id].status = status;
  }

  if (isConnected && pool) {
    try {
      await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    } catch (err) {
      console.error('[DB] Error updating lender status:', err);
    }
  }

  return memUsers[id] || null;
}

// Admin: List All Lenders
export async function getAllLenders() {
  if (isConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query(
        "SELECT * FROM users WHERE role = 'lender' ORDER BY created_at DESC"
      );
      return rows;
    } catch (err) {
      console.error('[DB] Error getting lenders:', err);
    }
  }

  return Object.values(memUsers).filter(u => u.role === 'lender');
}

// Admin: List All Users
export async function getAllUsers() {
  if (isConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return rows;
    } catch (err) {
      console.error('[DB] Error getting all users:', err);
    }
  }

  return Object.values(memUsers);
}

// Admin: Update User Role & Status
export async function updateUserAdmin(id: string, updates: { role?: string; status?: string }) {
  if (memUsers[id]) {
    if (updates.role) memUsers[id].role = updates.role as any;
    if (updates.status) memUsers[id].status = updates.status as any;
  }

  if (isConnected && pool) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      if (updates.role) {
        fields.push('role = ?');
        values.push(updates.role);
      }
      if (updates.status) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (fields.length > 0) {
        values.push(id);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
      }
      const [rows]: [any[], any] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length > 0) return rows[0];
    } catch (err) {
      console.error('[DB] Error updating user role/status by admin:', err);
    }
  }

  return memUsers[id] || null;
}

// Documents Management (Customer & Lender uploads)
export async function getDocuments(userId?: string) {
  if (isConnected && pool) {
    try {
      let query = 'SELECT * FROM documents';
      const params: any[] = [];
      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }
      query += ' ORDER BY uploaded_at DESC';
      const [rows]: [any[], any] = await pool.query(query, params);
      return rows;
    } catch (err) {
      console.error('[DB] Error getting documents:', err);
    }
  }

  if (userId) {
    return memDocuments.filter(d => d.user_id === userId);
  }
  return memDocuments;
}

export async function addDocument(docData: {
  user_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
}) {
  const newDoc: DocumentRecord = {
    ...docData,
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'verified',
    uploaded_at: new Date().toISOString(),
  };

  memDocuments.unshift(newDoc);

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO documents (id, user_id, doc_type, file_name, file_url, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newDoc.id, newDoc.user_id, newDoc.doc_type, newDoc.file_name, newDoc.file_url, newDoc.status]
      );
    } catch (err) {
      console.error('[DB] Error adding document:', err);
    }
  }

  return newDoc;
}

export async function deleteDocument(id: string) {
  memDocuments = memDocuments.filter(d => d.id !== id);

  if (isConnected && pool) {
    try {
      await pool.query('DELETE FROM documents WHERE id = ?', [id]);
    } catch (err) {
      console.error('[DB] Error deleting document:', err);
    }
  }

  return true;
}

// Bookings
export async function createBooking(bookingData: {
  car_id: string;
  car_title: string;
  car_image: string;
  renter_id: string;
  renter_name: string;
  renter_email: string;
  lender_id: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  total_days: number;
  price_per_day: number;
  total_price: number;
  insurance_plan?: string;
}) {
  const newBooking = {
    ...bookingData,
    id: `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    insurance_plan: bookingData.insurance_plan || 'Standard',
    status: 'confirmed',
    created_at: new Date().toISOString(),
  };

  memBookings.unshift(newBooking);

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO bookings (
          id, car_id, car_title, car_image, renter_id, renter_name, renter_email,
          lender_id, pickup_datetime, dropoff_datetime, total_days, price_per_day,
          total_price, insurance_plan, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newBooking.id,
          newBooking.car_id,
          newBooking.car_title,
          newBooking.car_image,
          newBooking.renter_id,
          newBooking.renter_name,
          newBooking.renter_email,
          newBooking.lender_id,
          newBooking.pickup_datetime,
          newBooking.dropoff_datetime,
          newBooking.total_days,
          newBooking.price_per_day,
          newBooking.total_price,
          newBooking.insurance_plan,
          newBooking.status,
        ]
      );
    } catch (err) {
      console.error('[DB] Error creating booking:', err);
    }
  }

  return newBooking;
}

export async function getBookings(filter: { renter_id?: string; lender_id?: string }) {
  if (isConnected && pool) {
    try {
      let query = 'SELECT * FROM bookings WHERE 1=1';
      const params: any[] = [];

      if (filter.renter_id) {
        query += ' AND renter_id = ?';
        params.push(filter.renter_id);
      }
      if (filter.lender_id) {
        query += ' AND lender_id = ?';
        params.push(filter.lender_id);
      }

      query += ' ORDER BY created_at DESC';

      const [rows]: [any[], any] = await pool.query(query, params);
      return rows.map((r: any) => ({
        ...r,
        total_days: Number(r.total_days),
        price_per_day: Number(r.price_per_day),
        total_price: Number(r.total_price),
      }));
    } catch (err) {
      console.error('[DB] Error getting bookings:', err);
    }
  }

  let result = [...memBookings];
  if (filter.renter_id) {
    result = result.filter(b => b.renter_id === filter.renter_id);
  }
  if (filter.lender_id) {
    result = result.filter(b => b.lender_id === filter.lender_id);
  }
  return result;
}

export async function updateBookingStatus(id: string, status: string) {
  const index = memBookings.findIndex(b => b.id === id);
  if (index !== -1) {
    memBookings[index].status = status;
  }

  if (isConnected && pool) {
    try {
      await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    } catch (err) {
      console.error('[DB] Error updating booking status:', err);
    }
  }

  return memBookings.find(b => b.id === id) || null;
}

export async function updateBookingDetails(id: string, updates: Record<string, any>) {
  const index = memBookings.findIndex(b => b.id === id);
  if (index !== -1) {
    memBookings[index] = { ...memBookings[index], ...updates };
  }

  if (isConnected && pool) {
    try {
      const allowedKeys = [
        'status', 'pickup_datetime', 'dropoff_datetime', 'total_days', 'total_price',
        'start_odometer', 'end_odometer', 'fuel_level', 'handover_status', 'handover_notes',
        'extra_km_charge', 'platform_commission', 'net_lender_payout', 'payout_status',
        'dispute_status', 'dispute_notes', 'cancellation_reason'
      ];
      const setClauses: string[] = [];
      const values: any[] = [];

      for (const [key, val] of Object.entries(updates)) {
        if (allowedKeys.includes(key)) {
          setClauses.push(`\`${key}\` = ?`);
          values.push(val === undefined ? null : val);
        }
      }

      if (setClauses.length > 0) {
        values.push(id);
        await pool.query(`UPDATE bookings SET ${setClauses.join(', ')} WHERE id = ?`, values);
      }

      const [rows]: [any[], any] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          total_days: Number(r.total_days),
          price_per_day: Number(r.price_per_day),
          total_price: Number(r.total_price),
          extra_km_charge: Number(r.extra_km_charge || 0),
          platform_commission: Number(r.platform_commission || 0),
          net_lender_payout: Number(r.net_lender_payout || 0),
        };
      }
    } catch (err) {
      console.error('[DB] Error updating booking details:', err);
    }
  }

  return memBookings.find(b => b.id === id) || null;
}

// Reviews
export async function getReviews(carId: string) {
  if (isConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM reviews WHERE car_id = ? ORDER BY created_at DESC',
        [carId]
      );
      return rows.map((r: any) => ({
        ...r,
        rating: Number(r.rating),
      }));
    } catch (err) {
      console.error('[DB] Error getting reviews:', err);
    }
  }

  return memReviews.filter(r => r.car_id === carId);
}

export async function addReview(reviewData: {
  car_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  comment: string;
}) {
  const newRev = {
    ...reviewData,
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };

  memReviews.unshift(newRev);

  const car = memCars.find(c => c.id === reviewData.car_id);
  if (car) {
    const carReviews = memReviews.filter(r => r.car_id === reviewData.car_id);
    const avg = carReviews.reduce((sum, r) => sum + r.rating, 0) / carReviews.length;
    car.rating = Math.round(avg * 100) / 100;
    car.reviews_count = carReviews.length;
  }

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO reviews (id, car_id, user_id, user_name, user_avatar, rating, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newRev.id, newRev.car_id, newRev.user_id, newRev.user_name, newRev.user_avatar, newRev.rating, newRev.comment]
      );
    } catch (err) {
      console.error('[DB] Error adding review:', err);
    }
  }

  return newRev;
}

// Platform Brand & Global Settings
export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (isConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query('SELECT * FROM platform_settings WHERE id = "global" LIMIT 1');
      if (rows && rows.length > 0) {
        memSettings = {
          ...memSettings,
          ...rows[0],
          brand_name: (rows[0].brand_name && rows[0].brand_name !== 'DriveMyCarz') ? rows[0].brand_name : 'Charvi Rental',
          brand_tagline: rows[0].brand_tagline || 'Self-Drive Fleet · India',
          logo_url: rows[0].logo_url || '',
          favicon_url: rows[0].favicon_url || '',
          contact_email: rows[0].contact_email || 'operationalhtklabs@gmail.com',
          contact_phone: rows[0].contact_phone || '+91 98765 43210',
          contact_address: rows[0].contact_address || 'Wakad, Pune, Maharashtra, India',
          domain_name: (rows[0].domain_name && rows[0].domain_name !== 'drivemycarz.com') ? rows[0].domain_name : 'charvirental.com',
          support_hours: rows[0].support_hours || '24/7 Roadside & Concierge Support',
          gst_number: rows[0].gst_number || '27AAACD1234F1Z5',
          social_instagram: rows[0].social_instagram || 'https://instagram.com/charvirental',
          social_twitter: rows[0].social_twitter || 'https://twitter.com/charvirental',
          social_facebook: rows[0].social_facebook || 'https://facebook.com/charvirental',
          commission_rate: rows[0].commission_rate != null ? Number(rows[0].commission_rate) : 10,
          gst_rate: rows[0].gst_rate != null ? Number(rows[0].gst_rate) : 18,
          security_deposit_default: rows[0].security_deposit_default != null ? Number(rows[0].security_deposit_default) : 3000,
          min_booking_hours: rows[0].min_booking_hours != null ? Number(rows[0].min_booking_hours) : 8,
          default_km_limit: rows[0].default_km_limit != null ? Number(rows[0].default_km_limit) : 300,
          default_extra_km_rate: rows[0].default_extra_km_rate != null ? Number(rows[0].default_extra_km_rate) : 12,
          auto_approve_vehicles: Boolean(rows[0].auto_approve_vehicles),
          auto_approve_hosts: Boolean(rows[0].auto_approve_hosts),
          available_cities: typeof rows[0].available_cities === 'string' ? JSON.parse(rows[0].available_cities) : rows[0].available_cities || ['Pune', 'Mumbai', 'Bangalore', 'Delhi NCR', 'Goa', 'Hyderabad'],
        };
        return memSettings;
      }
    } catch (err) {
      console.error('[DB] Error getting platform settings from MySQL:', err);
    }
  }
  return memSettings;
}

export async function updatePlatformSettings(updates: Partial<PlatformSettings>): Promise<PlatformSettings> {
  memSettings = {
    ...memSettings,
    ...updates,
    id: 'global',
    updated_at: new Date().toISOString(),
  };

  if (isConnected && pool) {
    try {
      const fields = [
        'brand_name',
        'brand_tagline',
        'logo_url',
        'favicon_url',
        'contact_email',
        'contact_phone',
        'contact_address',
        'domain_name',
        'support_hours',
        'gst_number',
        'social_instagram',
        'social_twitter',
        'social_facebook',
        'commission_rate',
        'gst_rate',
        'security_deposit_default',
        'min_booking_hours',
        'default_km_limit',
        'default_extra_km_rate',
        'auto_approve_vehicles',
        'auto_approve_hosts',
        'available_cities',
      ];
      const setClauses: string[] = [];
      const values: any[] = [];
      for (const field of fields) {
        if ((updates as any)[field] !== undefined) {
          setClauses.push(`\`${field}\` = ?`);
          const val = (updates as any)[field];
          if (field === 'available_cities' && Array.isArray(val)) {
            values.push(JSON.stringify(val));
          } else {
            values.push(val);
          }
        }
      }
      if (setClauses.length > 0) {
        values.push('global');
        await pool.query(
          `UPDATE platform_settings SET ${setClauses.join(', ')} WHERE id = ?`,
          values
        );
      }
    } catch (err) {
      console.error('[DB] Error updating platform settings in MySQL:', err);
    }
  }

  return memSettings;
}

export async function getUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (isConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [normalized]);
      if (rows && rows.length > 0) return rows[0];
    } catch (err) {
      console.error('[DB] Error finding user by email:', err);
    }
  }
  return Object.values(memUsers).find(u => u.email?.trim().toLowerCase() === normalized) || null;
}
