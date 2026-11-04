export interface CarRecord {
  id: string;
  lender_id: string;
  lender_name: string;
  lender_avatar: string;
  title: string;
  make: string;
  model: string;
  year: number;
  type: 'SUV' | 'Sedan' | 'Electric' | 'Convertible' | 'Luxury' | 'Truck';
  transmission: 'Automatic' | 'Manual';
  fuel: 'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel';
  seats: number;
  price_per_day: number;
  security_deposit?: number;
  location: string;
  city: string;
  image_url: string;
  images: string[];
  features: string[];
  rating: number;
  reviews_count: number;
  is_instant_book: boolean;
  is_available: boolean;
  approval_status: 'approved' | 'pending' | 'rejected';
  reg_number?: string;
  service_radius?: number;
  hub_lat?: number;
  hub_lng?: number;
  hub_area?: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  mileage?: string;
  km_limit?: number;
  extra_km_rate?: number;
  blackout_dates?: string[];
  lender_phone?: string;
  created_at: string;
}

export interface UserRecord {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'customer' | 'lender' | 'admin';
  status: 'approved' | 'pending' | 'rejected' | 'suspended';
  phone?: string;
  dob?: string;
  gender?: string;
  licence_number?: string;
  licence_expiry?: string;
  aadhaar_number?: string;
  onboarded?: boolean;
  bio?: string;
  password?: string;
  location?: string;
  address?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  status: 'verified' | 'pending' | 'rejected';
  uploaded_at: string;
}

export const INITIAL_USERS: UserRecord[] = [];

export const INITIAL_DOCUMENTS: DocumentRecord[] = [];

export const INITIAL_CARS: CarRecord[] = [];

export const INITIAL_REVIEWS: any[] = [];
