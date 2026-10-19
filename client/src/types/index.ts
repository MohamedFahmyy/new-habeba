// Shared types mirroring the Prisma schema
export interface User {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export interface Memory {
  id: number;
  giftId: number;
  imageUrl: string;
  title?: string;
  caption?: string;
  memoryDate?: string;
  sortOrder: number;
}

export interface TimelineEntry {
  id: number;
  giftId: number;
  title: string;
  description?: string;
  eventDate?: string;
  imageUrl?: string;
  sortOrder: number;
}

export interface Counter {
  id: number;
  giftId: number;
  label: string;
  targetValue: number;
  icon: string;
  sortOrder: number;
}

export type GiftStatus = 'draft' | 'published';
export type PaymentStatus = 'free' | 'paid' | 'pending';

export interface Gift {
  id: number;
  userId?: number;
  editToken: string;
  slug: string;
  title: string;
  senderName: string;
  recipientName: string;
  welcomeMessage?: string;
  themeId: string;
  themeConfig?: string;
  galleryStyle: 'masonry' | 'polaroid' | 'grid';
  musicUrl?: string;
  musicVideoId?: string;
  musicTitle?: string;
  letterTitle?: string;
  letterContent?: string;
  letterSignature?: string;
  surpriseTitle?: string;
  surpriseMessage?: string;
  anniversaryDate?: string;
  showTimeline: boolean;
  showGallery: boolean;
  showLetter: boolean;
  showCounters: boolean;
  showSurprise: boolean;
  status: GiftStatus;
  paymentStatus: PaymentStatus;
  isDemo: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  memories?: Memory[];
  timelineEntries?: TimelineEntry[];
  counters?: Counter[];
  _count?: { memories: number };
}

export interface Payment {
  id: number;
  giftId: number;
  userId: number;
  provider: 'instapay' | 'vodafone_cash' | 'card';
  transactionReference?: string;
  amount?: number;
  currency: string;
  status: 'awaiting_review' | 'approved' | 'rejected';
  receiptPath?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSettings {
  paymentsEnabled: boolean;
  price: number;
  currency: string;
  instapay: { enabled: boolean; address?: string; instructions?: string };
  vodafoneCash: { enabled: boolean; number?: string; instructions?: string };
  card: { enabled: boolean };
}

export interface PlatformSettings {
  payments_enabled: string;
  payment_price: string;
  payment_currency: string;
  instapay_enabled: string;
  instapay_address: string;
  instapay_instructions: string;
  vodafone_cash_enabled: string;
  vodafone_cash_number: string;
  vodafone_cash_instructions: string;
  card_enabled: string;
  require_manual_review: string;
}

export interface Theme {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  previewGradient: string;
  tag: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Wizard step data
export interface WizardFormData {
  senderName: string;
  recipientName: string;
  title: string;
  welcomeMessage: string;
  themeId: string;
  galleryStyle: 'masonry' | 'polaroid' | 'grid';
  musicUrl: string;
  musicTitle: string;
  letterTitle: string;
  letterContent: string;
  letterSignature: string;
  surpriseTitle: string;
  surpriseMessage: string;
  anniversaryDate: string;
  slug: string;
  status: GiftStatus;
  showTimeline: boolean;
  showGallery: boolean;
  showLetter: boolean;
  showCounters: boolean;
  showSurprise: boolean;
}
