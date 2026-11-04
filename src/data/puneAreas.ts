export interface PuneArea {
  name: string;
  shortName: string;
  zone: 'IT Hubs & West' | 'East Pune & IT' | 'Central Pune' | 'PCMC' | 'South Pune' | 'North & Suburbs';
  popular?: boolean;
}

export const ALL_PUNE_AREAS: PuneArea[] = [
  // West Pune & IT Hubs
  { name: 'Wakad, Pune', shortName: 'Wakad', zone: 'IT Hubs & West', popular: true },
  { name: 'Hinjawadi Phase 1, Pune', shortName: 'Hinjawadi Phase 1', zone: 'IT Hubs & West', popular: true },
  { name: 'Hinjawadi Phase 2, Pune', shortName: 'Hinjawadi Phase 2', zone: 'IT Hubs & West', popular: true },
  { name: 'Hinjawadi Phase 3, Pune', shortName: 'Hinjawadi Phase 3', zone: 'IT Hubs & West', popular: true },
  { name: 'Baner, Pune', shortName: 'Baner', zone: 'IT Hubs & West', popular: true },
  { name: 'Balewadi, Pune', shortName: 'Balewadi', zone: 'IT Hubs & West', popular: true },
  { name: 'Aundh, Pune', shortName: 'Aundh', zone: 'IT Hubs & West', popular: true },
  { name: 'Pashan, Pune', shortName: 'Pashan', zone: 'IT Hubs & West' },
  { name: 'Bavdhan, Pune', shortName: 'Bavdhan', zone: 'IT Hubs & West' },
  { name: 'Sus, Pune', shortName: 'Sus', zone: 'IT Hubs & West' },
  { name: 'Mahalunge, Pune', shortName: 'Mahalunge', zone: 'IT Hubs & West' },
  { name: 'Punawale, Pune', shortName: 'Punawale', zone: 'IT Hubs & West' },
  { name: 'Tathawade, Pune', shortName: 'Tathawade', zone: 'IT Hubs & West' },
  { name: 'Ravet, Pune', shortName: 'Ravet', zone: 'IT Hubs & West' },

  // PCMC
  { name: 'Pimple Saudagar, Pune', shortName: 'Pimple Saudagar', zone: 'PCMC', popular: true },
  { name: 'Pimple Nilakh, Pune', shortName: 'Pimple Nilakh', zone: 'PCMC' },
  { name: 'Pimple Gurav, Pune', shortName: 'Pimple Gurav', zone: 'PCMC' },
  { name: 'Chinchwad, Pune', shortName: 'Chinchwad', zone: 'PCMC', popular: true },
  { name: 'Akurdi, Pune', shortName: 'Akurdi', zone: 'PCMC' },
  { name: 'Nigdi, Pune', shortName: 'Nigdi', zone: 'PCMC' },
  { name: 'Pimpri, Pune', shortName: 'Pimpri', zone: 'PCMC' },
  { name: 'Bhosari, Pune', shortName: 'Bhosari', zone: 'PCMC' },
  { name: 'Sangvi, Pune', shortName: 'Sangvi', zone: 'PCMC' },
  { name: 'Thergaon, Pune', shortName: 'Thergaon', zone: 'PCMC' },
  { name: 'Rahatani, Pune', shortName: 'Rahatani', zone: 'PCMC' },
  { name: 'Moshi, Pune', shortName: 'Moshi', zone: 'PCMC' },
  { name: 'Chakan, Pune', shortName: 'Chakan', zone: 'PCMC' },

  // East Pune & IT Parks
  { name: 'Viman Nagar, Pune', shortName: 'Viman Nagar', zone: 'East Pune & IT', popular: true },
  { name: 'Kharadi, Pune', shortName: 'Kharadi', zone: 'East Pune & IT', popular: true },
  { name: 'Koregaon Park, Pune', shortName: 'Koregaon Park', zone: 'East Pune & IT', popular: true },
  { name: 'Kalyani Nagar, Pune', shortName: 'Kalyani Nagar', zone: 'East Pune & IT', popular: true },
  { name: 'Magarpatta City, Pune', shortName: 'Magarpatta City', zone: 'East Pune & IT', popular: true },
  { name: 'Hadapsar, Pune', shortName: 'Hadapsar', zone: 'East Pune & IT' },
  { name: 'Yerwada, Pune', shortName: 'Yerwada', zone: 'East Pune & IT' },
  { name: 'Wadgaon Sheri, Pune', shortName: 'Wadgaon Sheri', zone: 'East Pune & IT' },
  { name: 'Mundhwa, Pune', shortName: 'Mundhwa', zone: 'East Pune & IT' },
  { name: 'Chandan Nagar, Pune', shortName: 'Chandan Nagar', zone: 'East Pune & IT' },
  { name: 'Wagholi, Pune', shortName: 'Wagholi', zone: 'East Pune & IT' },
  { name: 'Keshav Nagar, Pune', shortName: 'Keshav Nagar', zone: 'East Pune & IT' },
  { name: 'Phursungi, Pune', shortName: 'Phursungi', zone: 'East Pune & IT' },

  // Central Pune & Heritage
  { name: 'Shivajinagar, Pune', shortName: 'Shivajinagar', zone: 'Central Pune', popular: true },
  { name: 'FC Road (Fergusson College Rd), Pune', shortName: 'FC Road', zone: 'Central Pune', popular: true },
  { name: 'SB Road (Senapati Bapat Rd), Pune', shortName: 'SB Road', zone: 'Central Pune' },
  { name: 'Deccan Gymkhana, Pune', shortName: 'Deccan Gymkhana', zone: 'Central Pune' },
  { name: 'Pune Camp (MG Road), Pune', shortName: 'Pune Camp', zone: 'Central Pune', popular: true },
  { name: 'Swargate, Pune', shortName: 'Swargate', zone: 'Central Pune' },
  { name: 'Kothrud, Pune', shortName: 'Kothrud', zone: 'Central Pune', popular: true },
  { name: 'Erandwane, Pune', shortName: 'Erandwane', zone: 'Central Pune' },
  { name: 'Karve Nagar, Pune', shortName: 'Karve Nagar', zone: 'Central Pune' },
  { name: 'Model Colony, Pune', shortName: 'Model Colony', zone: 'Central Pune' },
  { name: 'Prabhat Road, Pune', shortName: 'Prabhat Road', zone: 'Central Pune' },
  { name: 'Sadashiv Peth, Pune', shortName: 'Sadashiv Peth', zone: 'Central Pune' },

  // South Pune
  { name: 'Katraj, Pune', shortName: 'Katraj', zone: 'South Pune' },
  { name: 'Bibwewadi, Pune', shortName: 'Bibwewadi', zone: 'South Pune' },
  { name: 'Kondhwa, Pune', shortName: 'Kondhwa', zone: 'South Pune' },
  { name: 'Undri, Pune', shortName: 'Undri', zone: 'South Pune' },
  { name: 'Pisoli, Pune', shortName: 'Pisoli', zone: 'South Pune' },
  { name: 'Dhayari, Pune', shortName: 'Dhayari', zone: 'South Pune' },
  { name: 'Narhe, Pune', shortName: 'Narhe', zone: 'South Pune' },
  { name: 'Vadgaon Budruk, Pune', shortName: 'Vadgaon Budruk', zone: 'South Pune' },
  { name: 'Warje, Pune', shortName: 'Warje', zone: 'South Pune' },
  { name: 'Nanded City, Pune', shortName: 'Nanded City', zone: 'South Pune', popular: true },
  { name: 'Ambegaon, Pune', shortName: 'Ambegaon', zone: 'South Pune' },

  // North & Outskirts / Transit Hubs
  { name: 'Pune International Airport (PNQ), Pune', shortName: 'Pune Airport (PNQ)', zone: 'North & Suburbs', popular: true },
  { name: 'Pune Railway Station, Pune', shortName: 'Pune Station', zone: 'Central Pune', popular: true },
  { name: 'Lohegaon, Pune', shortName: 'Lohegaon', zone: 'North & Suburbs' },
  { name: 'Dighi, Pune', shortName: 'Dighi', zone: 'North & Suburbs' },
  { name: 'Charholi Budruk, Pune', shortName: 'Charholi', zone: 'North & Suburbs' },
  { name: 'Pirangut, Pune', shortName: 'Pirangut', zone: 'North & Suburbs' },
  { name: 'Lavasa Road, Pune', shortName: 'Lavasa Road', zone: 'North & Suburbs' },
];
