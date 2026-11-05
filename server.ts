import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import {
  initDatabase,
  getDbStatus,
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  setCarApprovalStatus,
  setLenderApprovalStatus,
  getAllLenders,
  getAllUsers,
  updateUserAdmin,
  getDocuments,
  addDocument,
  deleteDocument,
  createBooking,
  getBookings,
  updateBookingStatus,
  updateBookingDetails,
  syncUser,
  getUser,
  updateUserProfile,
  deleteAccountAndData,
  getReviews,
  addReview,
  getPlatformSettings,
  updatePlatformSettings,
  getUserByEmail
} from './server/db.ts';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Setup Multer in-memory storage for S3 stream forwarding
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize DB (MySQL with operational fallback)
initDatabase().catch(err => console.error('[Server] DB init notice:', err));

// ================= API ROUTES =================

// Platform Status & Verification
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: getDbStatus()
  });
});

// Firebase Config Bridge (Reads from google-services.json in root if uploaded)
app.get('/api/firebase-config', async (req, res) => {
  try {
    const fs = await import('fs');
    const possiblePaths = [
      path.join(process.cwd(), 'google-services.json'),
      path.join(__dirname, 'google-services.json'),
      path.join(__dirname, '..', 'google-services.json'),
    ];
    
    const configPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (configPath) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const data = JSON.parse(raw);
      
      // Map google-services.json (Firebase configuration) to Web Config
      const projectInfo = data.project_info || {};
      const client = data.client?.[0] || {};
      const clientInfo = client.client_info || {};
      const apiKey = client.api_key?.[0]?.current_key || '';
      const webOAuth = client.oauth_client?.find((o: any) => o.client_type === 3) || client.oauth_client?.[0];
      
      const webConfig = {
        projectId: projectInfo.project_id,
        appId: clientInfo.mobilesdk_app_id,
        apiKey: apiKey,
        authDomain: `${projectInfo.project_id}.firebaseapp.com`,
        storageBucket: projectInfo.storage_bucket || `${projectInfo.project_id}.firebasestorage.app`,
        messagingSenderId: projectInfo.project_number,
        oAuthClientId: webOAuth?.client_id || '',
      };
      
      console.log(`[Config] Loaded Firebase settings from ${configPath} (Project: ${webConfig.projectId})`);
      return res.json(webConfig);
    }
    
    // Fallback if file not found
    res.json(null);
  } catch (err) {
    console.error('[Config] Error reading google-services.json:', err);
    res.json(null);
  }
});

// S3 Storage Connection Status
app.get('/api/s3-status', (req, res) => {
  const apiKey = process.env.S3_API_KEY || process.env.API_KEY;
  const workspaceId = process.env.S3_WORKSPACE_ID || process.env.WORKSPACE_ID;
  res.json({
    connected: true,
    provider: 'HTK Network S3',
    endpoint: 'https://s3.htknetwork.in/api/upload',
    workspace_id: workspaceId,
    workspace_name: 'DMYCars',
    has_api_key: Boolean(apiKey),
    api_key_preview: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : null
  });
});

// S3 File Storage Upload Endpoint (Supports Multipart form-data AND Base64 JSON)
app.post('/api/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    const apiKey = process.env.S3_API_KEY || process.env.API_KEY;
    const workspaceId = process.env.S3_WORKSPACE_ID || process.env.WORKSPACE_ID;
    
    let fileBuffer: Buffer | null = null;
    let originalName = 'upload.jpg';
    let mimeType = 'image/jpeg';
    let caption = 'DriveMyCarz Upload';

    if (req.file) {
      fileBuffer = req.file.buffer;
      originalName = req.file.originalname;
      mimeType = req.file.mimetype;
      caption = req.body?.caption || req.file.originalname || caption;
    } else if (req.body?.file_base64) {
      // Decode Base64 string
      const rawBase64 = req.body.file_base64;
      const matches = rawBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(rawBase64, 'base64');
      }
      originalName = req.body.file_name || 'uploaded_image.jpg';
      caption = req.body.caption || originalName;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No file data received in request' });
    }

    const fileName = req.body?.file_name || originalName;

    const formData = new FormData();
    const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    formData.append('file', fileBlob, originalName);
    formData.append('workspace_id', String(workspaceId));
    formData.append('file_name', fileName);
    formData.append('caption', caption);

    console.log(`[S3 Upload] Forwarding ${originalName} (${fileBuffer.length} bytes, ws: ${workspaceId}) to https://s3.htknetwork.in/api/upload...`);

    const s3Response = await fetch('https://s3.htknetwork.in/api/upload', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey as string,
      },
      body: formData,
    });

    const data: any = await s3Response.json();

    if (s3Response.ok && data && (data.success || data.file_url || data.direct_link)) {
      console.log(`[S3 Upload] Success! File stored at: ${data.direct_link || data.file_url}`);
      return res.json({
        success: true,
        file_slug: data.file_slug,
        file_url: data.direct_link || data.file_url,
        direct_link: data.direct_link || data.file_url,
        file_name: data.file_name || originalName,
        file_size: data.file_size || fileBuffer.length,
        mime_type: data.mime_type || mimeType,
        workspace_id: workspaceId,
        created_at: data.created_at || new Date().toISOString(),
      });
    } else {
      console.error('[S3 Upload Error Response]', data);
      return res.status(s3Response.status || 500).json({
        error: data?.message || data?.error || 'S3 Network Storage Upload Failed',
        details: data,
      });
    }
  } catch (error: any) {
    console.error('[S3 Upload Server Exception]', error);
    return res.status(500).json({ error: error.message || 'Internal server error during S3 file upload' });
  }
});


// Cars: List & Filter (Public only sees approved cars, Lender sees their own cars)
app.get('/api/cars', async (req, res) => {
  try {
    const {
      pickup,
      dropoff,
      location,
      type,
      transmission,
      fuel,
      seats,
      minPrice,
      maxPrice,
      instantBook,
      lenderId,
      all
    } = req.query;

    const cars = await getCars({
      pickup: pickup as string,
      dropoff: dropoff as string,
      location: location as string,
      type: type as string,
      transmission: transmission as string,
      fuel: fuel as string,
      seats: seats ? parseInt(seats as string, 10) : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      instantBook: instantBook === 'true',
      lenderId: lenderId as string,
      includeAllApprovalStatuses: all === 'true',
    });

    res.json(cars);
  } catch (error: any) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cars' });
  }
});

// Car details
app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await getCarById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    const reviews = await getReviews(req.params.id);
    res.json({ ...car, reviews });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get car details' });
  }
});

// Create Car (Lender action - persists into database with lender_id)
app.post('/api/cars', async (req, res) => {
  try {
    const {
      lender_id,
      lender_name,
      lender_avatar,
      title,
      make,
      model,
      year,
      type,
      transmission,
      fuel,
      seats,
      price_per_day,
      location,
      city,
      image_url,
      images,
      features,
      is_instant_book,
      approval_status,
      reg_number,
      service_radius,
      hub_lat,
      hub_lng,
      hub_area,
      description,
      seo_title,
      seo_description,
      mileage,
      km_limit,
      extra_km_rate,
      lender_phone,
    } = req.body;

    const effectiveLenderId = lender_id;

    if (!effectiveLenderId || !title || !price_per_day) {
      return res.status(400).json({ error: 'Missing required vehicle listing fields (lender_id, title, price_per_day)' });
    }

    const newCar = await createCar({
      lender_id: effectiveLenderId,
      lender_name: lender_name || 'Verified Host',
      lender_avatar: lender_avatar || '',
      title,
      make: make || title.split(' ')[0] || 'Custom',
      model: model || title.split(' ').slice(1).join(' ') || 'Model',
      year: Number(year) || new Date().getFullYear(),
      type: type || 'SUV',
      transmission: transmission || 'Automatic',
      fuel: fuel || 'Diesel',
      seats: Number(seats) || 5,
      price_per_day: Number(price_per_day),
      location: location || 'Pune, Maharashtra',
      city: city || 'Pune, Maharashtra',
      image_url: image_url || (Array.isArray(images) && images[0]) || 'https://via.placeholder.com/1200x800.png?text=Vehicle+Photo+Pending',
      images: Array.isArray(images) && images.length > 0 ? images : [image_url || 'https://via.placeholder.com/1200x800.png?text=Vehicle+Photo+Pending'],
      features: Array.isArray(features) ? features : ['FASTag Toll Enabled', 'Keyless Self-Pickup'],
      is_instant_book: Boolean(is_instant_book),
      is_available: true,
      approval_status: approval_status || 'pending', // Require Admin Approval!
      reg_number: reg_number || '',
      service_radius: Number(service_radius) || 4,
      hub_lat: Number(hub_lat) || 18.5204,
      hub_lng: Number(hub_lng) || 73.8567,
      hub_area: hub_area || city || 'Pune',
      description: description || '',
      seo_title: seo_title || '',
      seo_description: seo_description || '',
      mileage: mileage || '16 km/l',
      km_limit: Number(km_limit) || 300,
      extra_km_rate: Number(extra_km_rate) || 12,
      lender_phone: lender_phone,
    });

    console.log(`[DB] Creating new car listing. Title: ${title}, image_url provided: ${image_url ? 'Yes' : 'No'}, images array length: ${Array.isArray(images) ? images.length : 'N/A'}`);
    console.log(`[DB] Final resolved image_url: ${newCar.image_url}`);
    
    console.log(`[DB] Created new car listing (Pending Admin Review): ${newCar.id} (${newCar.title}) for lender: ${newCar.lender_id}`);
    res.status(201).json(newCar);
  } catch (error: any) {
    console.error('Error creating car listing:', error);
    res.status(500).json({ error: error.message || 'Failed to list car' });
  }
});

// AI Car Listing Assistant via Gemini 3.1 Flash Lite (Token Efficient)
app.post('/api/ai-assistant/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], currentDraft = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured on server.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemPrompt = `You are DriveMyCarz AI Fleet Assistant. Your purpose is to help car hosts list their vehicles on our rental platform in Pune, India.
Extract all car details from user conversation and current draft:
- Brand/Make (e.g. Hyundai, Tata, Mahindra, Maruti, Toyota, BMW)
- Model (e.g. Creta, Thar, i20, Nexon, Fortuner, Brezza)
- Year (number)
- Registration Number (e.g. MH 14 NH 7408)
- Body Type (SUV, Sedan, Electric, Luxury, Convertible, Truck)
- Fuel Type (Diesel, Petrol, Electric, Hybrid)
- Transmission (Automatic, Manual)
- Seating Capacity (number)
- Daily Rental Price in INR (e.g. 3500)
- Security Deposit in INR (e.g. 2000)
- Pickup Location/Address in Pune (e.g. Wakad, Hinjewadi, Baner, Kothrud)
- Description/Overview (short paragraph)
- Features & Preferences (list of strings like FASTag, Sunroof, Dashcam, Child Seat)

Current Draft State: ${JSON.stringify(currentDraft)}

Instructions:
1. Respond concisely (max 2 sentences). Ask 1-2 missing required items if needed.
2. Merge existing draft state with newly extracted details.
3. Determine if draft has enough info (Brand, Model, Year, Price, Pickup Location) to be ready to publish.

IMPORTANT: Respond ONLY with valid JSON matching this schema:
{
  "reply": "Short assistant response...",
  "extracted_car": {
    "make": "string or null",
    "model": "string or null",
    "year": "number or null",
    "reg_number": "string or null",
    "type": "string or null",
    "transmission": "string or null",
    "fuel": "string or null",
    "seats": "number or null",
    "price_per_day": "number or null",
    "security_deposit": "number or null",
    "location": "string or null",
    "city": "string or null",
    "description": "string or null",
    "features": ["string"]
  },
  "is_ready_to_publish": boolean
}`;

    // Limit conversation history to last 6 items to conserve API key tokens
    const trimmedHistory = conversationHistory.slice(-6);
    const conversationText = trimmedHistory
      .map((m: any) => `${m.role === 'user' ? 'Host' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `${conversationText ? conversationText + '\n' : ''}Host: ${message}`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const responseText = geminiResponse.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        reply: responseText || "I've processed your car details!",
        extracted_car: currentDraft,
        is_ready_to_publish: false,
      };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini AI Agent',
    });
  }
});

// Update Car (Lender action)
app.put('/api/cars/:id', async (req, res) => {
  try {
    const updated = await updateCar(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update car' });
  }
});

// Delete Car
app.delete('/api/cars/:id', async (req, res) => {
  try {
    await deleteCar(req.params.id);
    res.json({ success: true, message: 'Vehicle listing removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete car' });
  }
});

// ================= ADMIN ROUTES =================

// Admin: Get all cars including pending approval
app.get('/api/admin/cars', async (req, res) => {
  try {
    const cars = await getCars({ includeAllApprovalStatuses: true });
    res.json(cars);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin cars' });
  }
});

// Admin: Approve or Reject a car
app.patch('/api/admin/cars/:id/approval', async (req, res) => {
  try {
    const { approval_status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(approval_status)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }
    const updated = await setCarApprovalStatus(req.params.id, approval_status);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update car approval' });
  }
});

// Check if email already exists (for Host / Renter registration check)
app.get('/api/users/check-email', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }
    const user = await getUserByEmail(email);
    res.json({
      exists: Boolean(user),
      role: user?.role || null,
      name: user?.name || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to check email' });
  }
});

// Platform & Brand Settings Routes
app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await getPlatformSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch platform settings' });
  }
});

app.patch('/api/admin/settings', async (req, res) => {
  try {
    const updated = await updatePlatformSettings(req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update platform settings' });
  }
});

// Admin: Get all lenders
app.get('/api/admin/lenders', async (req, res) => {
  try {
    const lenders = await getAllLenders();
    res.json(lenders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch lenders' });
  }
});

// Admin: Approve or Reject a lender
app.patch('/api/admin/lenders/:id/approval', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await setLenderApprovalStatus(req.params.id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update lender approval' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

// Admin: Update user role or status
app.patch('/api/admin/users/:id', async (req, res) => {
  try {
    const { role, status } = req.body;
    const updated = await updateUserAdmin(req.params.id, { role, status });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user role/status' });
  }
});

// ================= DOCUMENTS ROUTES (Customer Dashboard) =================

app.get('/api/documents', async (req, res) => {
  try {
    const { user_id } = req.query;
    const docs = await getDocuments(user_id as string);
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch documents' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const { user_id, doc_type, file_name, file_url } = req.body;
    if (!user_id || !doc_type || !file_name) {
      return res.status(400).json({ error: 'Missing document parameters' });
    }
    const doc = await addDocument({
      user_id,
      doc_type,
      file_name,
      file_url: file_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    });
    res.status(201).json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    await deleteDocument(req.params.id);
    res.json({ success: true, message: 'Document removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete document' });
  }
});

// ================= BOOKINGS ROUTES =================

app.get('/api/bookings', async (req, res) => {
  try {
    const { renter_id, lender_id } = req.query;
    const bookings = await getBookings({
      renter_id: renter_id as string,
      lender_id: lender_id as string,
    });
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const {
      car_id,
      car_title,
      car_image,
      renter_id,
      renter_name,
      renter_email,
      lender_id,
      pickup_datetime,
      dropoff_datetime,
      total_days,
      price_per_day,
      total_price,
      insurance_plan,
    } = req.body;

    if (!car_id || !renter_id || !pickup_datetime || !dropoff_datetime) {
      return res.status(400).json({ error: 'Missing mandatory booking parameters' });
    }

    const booking = await createBooking({
      car_id,
      car_title,
      car_image,
      renter_id,
      renter_name: renter_name || 'Valued Guest',
      renter_email: renter_email || 'guest@drivemycarz.com',
      lender_id: lender_id,
      pickup_datetime,
      dropoff_datetime,
      total_days: Number(total_days) || 1,
      price_per_day: Number(price_per_day) || 100,
      total_price: Number(total_price) || 100,
      insurance_plan: insurance_plan || 'Standard',
    });

    res.status(201).json(booking);
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message || 'Failed to process booking' });
  }
});

app.patch('/api/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateBookingStatus(req.params.id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update booking' });
  }
});

app.patch('/api/bookings/:id/details', async (req, res) => {
  try {
    const updated = await updateBookingDetails(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update booking details' });
  }
});

// Users
app.post('/api/users/sync', async (req, res) => {
  try {
    const user = await syncUser(req.body);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

app.patch('/api/users/:id/profile', async (req, res) => {
  try {
    const updated = await updateUserProfile(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update user profile' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await deleteAccountAndData(req.params.id);
    res.json(result);
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
});

// Reviews
app.get('/api/cars/:id/reviews', async (req, res) => {
  try {
    const reviews = await getReviews(req.params.id);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get reviews' });
  }
});

app.post('/api/cars/:id/reviews', async (req, res) => {
  try {
    const { user_id, user_name, user_avatar, rating, comment } = req.body;
    const review = await addReview({
      car_id: req.params.id,
      user_id,
      user_name,
      user_avatar,
      rating: Number(rating) || 5,
      comment,
    });
    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to post review' });
  }
});

// ================= SEO & PUBLIC PROFILE ROUTES =================

// Public Lender / Host Profile with Approved Fleet
app.get('/api/lenders/:id/profile', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    const cars = await getCars({ lenderId: req.params.id });
    if (user) {
      res.json({
        id: user.id,
        name: user.name || 'Verified Host',
        avatar: user.avatar || (cars[0]?.lender_avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: user.bio || `Verified peer-to-peer host offering self-drive rentals in ${cars[0]?.city || 'Pune'}. Quality assured, fully insured vehicles.`,
        city: cars[0]?.city || user.location || 'Pune',
        location: user.location || `${cars[0]?.city || 'Pune'}, Maharashtra`,
        member_since: '2023',
        rating: cars.length > 0 ? (cars.reduce((acc, c) => acc + c.rating, 0) / cars.length) : 4.95,
        trips_count: Math.max(cars.length * 12, 28),
        response_rate: '100% within 15 mins',
        verified: true,
        cars,
      });
    } else if (cars.length > 0) {
      const firstCar = cars[0];
      res.json({
        id: req.params.id,
        name: firstCar.lender_name || 'Verified Host',
        avatar: firstCar.lender_avatar,
        bio: `Verified peer-to-peer fleet host in ${firstCar.city}. Clean, well-maintained vehicles with contactless handover.`,
        city: firstCar.city,
        location: `${firstCar.city}, Maharashtra`,
        member_since: '2023',
        rating: firstCar.rating || 4.95,
        trips_count: 36,
        response_rate: '100% within 15 mins',
        verified: true,
        cars,
      });
    } else {
      res.status(404).json({ error: 'Host not found' });
    }
  } catch (err: any) {
    console.error('Error fetching public lender profile:', err);
    res.status(500).json({ error: 'Failed to fetch host profile' });
  }
});

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://charvirental.com/sitemap.xml\n');
});

// Dynamic sitemap.xml with cars, hosts, and city landings
app.get('/sitemap.xml', async (req, res) => {
  try {
    const cars = await getCars({ includeAllApprovalStatuses: false });
    const baseUrl = 'https://charvirental.com';
    const now = new Date().toISOString().split('T')[0];

    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
      { path: '/insurance-protection', priority: '0.8', changefreq: 'monthly' },
      { path: '/host-leasing', priority: '0.9', changefreq: 'weekly' },
      { path: '/become-a-host', priority: '0.9', changefreq: 'weekly' },
      { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    ];

    const cityPages = [
      { path: '/?city=Pune', priority: '0.9', changefreq: 'daily' },
      { path: '/?city=Mumbai', priority: '0.9', changefreq: 'daily' },
      { path: '/?city=Delhi%20NCR', priority: '0.8', changefreq: 'daily' },
      { path: '/?city=Bengaluru', priority: '0.8', changefreq: 'daily' },
      { path: '/?city=Hyderabad', priority: '0.8', changefreq: 'daily' },
      { path: '/?city=Goa', priority: '0.8', changefreq: 'daily' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    for (const p of staticPages) {
      xml += `  <url>\n    <loc>${baseUrl}${p.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    }

    for (const c of cityPages) {
      xml += `  <url>\n    <loc>${baseUrl}${c.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${c.changefreq}</changefreq>\n    <priority>${c.priority}</priority>\n  </url>\n`;
    }

    // Approved Cars with Google Images
    for (const car of cars) {
      xml += `  <url>\n    <loc>${baseUrl}/car/${car.id}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n`;
      if (car.image_url) {
        xml += `    <image:image>\n      <image:loc>${car.image_url}</image:loc>\n      <image:title>${car.year} ${car.make} ${car.model} in ${car.city}</image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    // Active Lenders
    const seenLenders = new Set<string>();
    for (const car of cars) {
      if (car.lender_id && !seenLenders.has(car.lender_id)) {
        seenLenders.add(car.lender_id);
        xml += `  <url>\n    <loc>${baseUrl}/host/${car.lender_id}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    }

    xml += `</urlset>`;

    res.type('application/xml');
    res.send(xml);
  } catch (err: any) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Helper for SSR Meta Tag Injection
async function injectMetaTags(html: string, req: express.Request): Promise<string> {
  const urlPath = req.path;
  const baseUrl = 'https://charvirental.com';

  if (urlPath.startsWith('/car/') || urlPath.startsWith('/cars/')) {
    const carId = urlPath.split('/')[2];
    if (carId) {
      try {
        const car = await getCarById(carId);
        if (car) {
          const title = `${car.make} ${car.model} (${car.year}) Self-Drive Rental in ${car.city} - ₹${car.price_per_day}/day | Charvi Rental`;
          const desc = car.seo_description || car.description || `Rent ${car.year} ${car.make} ${car.model} in ${car.city} on Charvi Rental for ₹${car.price_per_day.toLocaleString('en-IN')}/day. ${car.transmission}, ${car.fuel}, ${car.seats} seats. Doorstep delivery & insurance included.`;
          const img = car.image_url || `${baseUrl}/assets/hero_cars_crop.png`;
          const canonical = `${baseUrl}/car/${car.id}`;

          return html
            .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
            .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${desc.replace(/"/g, '&quot;')}" />`)
            .replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${canonical}" />`)
            .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`)
            .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />`)
            .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${img}" />`)
            .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${canonical}" />`)
            .replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />`)
            .replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />`)
            .replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${img}" />`);
        }
      } catch (e) {
        console.error('Error injecting car meta:', e);
      }
    }
  } else if (urlPath.startsWith('/host/') || urlPath.startsWith('/lender-profile/')) {
    const hostId = urlPath.split('/')[2];
    if (hostId) {
      try {
        const user = await getUser(hostId);
        const cars = await getCars({ lenderId: hostId });
        const hostName = user?.name || cars[0]?.lender_name || 'Verified Host';
        const city = cars[0]?.city || user?.location || 'Pune';
        const title = `${hostName}'s Verified Car Fleet in ${city} | Charvi Rental`;
        const desc = `Book self-drive cars directly from verified host ${hostName} in ${city}. Transparent daily pricing, comprehensive insurance, and doorstep delivery.`;
        const img = cars[0]?.image_url || user?.avatar || `${baseUrl}/assets/hero_cars_crop.png`;
        const canonical = `${baseUrl}/host/${hostId}`;

        return html
          .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
          .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${desc.replace(/"/g, '&quot;')}" />`)
          .replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${canonical}" />`)
          .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`)
          .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />`)
          .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${img}" />`)
          .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${canonical}" />`)
          .replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />`)
          .replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />`)
          .replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${img}" />`);
      } catch (e) {
        console.error('Error injecting host meta:', e);
      }
    }
  }

  return html;
}

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Highly optimized static asset caching under /assets for Cloudflare cache rules
    app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
      maxAge: '365d',
      immutable: true
    }));
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', async (req, res) => {
      try {
        const indexPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8');
          html = await injectMetaTags(html, req);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.send(html);
        } else {
          res.sendFile(indexPath);
        }
      } catch {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`DriveMyCarz server active on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    console.log('[Server] Gracefully shutting down...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
