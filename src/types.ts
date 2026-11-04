export type UserRole = 'renter' | 'lender' | 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  status?: 'approved' | 'pending' | 'rejected' | 'suspended';
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
  created_at?: string;
}

export interface Car {
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
  approval_status?: 'approved' | 'pending' | 'rejected';
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
  created_at?: string;
  lender_phone?: string;
  reviews?: Review[];
}

export interface Booking {
  id: string;
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
  insurance_plan: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  start_odometer?: number;
  end_odometer?: number;
  fuel_level?: string;
  handover_status?: 'pending' | 'checked_in' | 'checked_out';
  handover_notes?: string;
  extra_km_charge?: number;
  platform_commission?: number;
  net_lender_payout?: number;
  payout_status?: 'pending' | 'processing' | 'paid';
  dispute_status?: 'none' | 'open' | 'resolved';
  dispute_notes?: string;
  cancellation_reason?: string;
  created_at: string;
}

export interface Review {
  id: string;
  car_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface FilterState {
  location: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  type: string;
  transmission: string;
  fuel: string;
  minPrice: number;
  maxPrice: number;
  seats: number;
  instantBookOnly: boolean;
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating';
}

export interface DbStatusInfo {
  connected: boolean;
  host: string;
  port: number;
  user: string;
  database: string;
  message: string;
  stats?: {
    cars: number;
    bookings: number;
    users: number;
  };
}
