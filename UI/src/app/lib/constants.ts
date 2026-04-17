// API Configuration
export const API_BASE_URL = 'http://localhost:5000/api';

// Blockchain Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

// Admin Wallet (should not be used by voters)
export const ADMIN_WALLET = '0x5b979D566867F2f5abaEE5d51292E1bd1740f103';

// Token Storage Key
export const AUTH_TOKEN_KEY = 'evf_token';

// Color Palette
export const COLORS = {
  primary: '#1a1a2e',
  accent: '#e94560',
  muted: '#f5f5f5',
  dark: '#16213e',
};

// Phase Types
export type Phase = 'registration' | 'voting' | 'completed';

// User Roles
export type UserRole = 'voter' | 'admin';
