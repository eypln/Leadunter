// Database types for Lead Hunter

export type LeadType = 'OWNER' | 'CLIENT';

export type LeadStatus = 'NEW' | 'RESPONDED' | 'SKIPPED' | 'INTERESTED' | 'AGENT';

export type MessageTemplateType = 'WHATSAPP' | 'MESSENGER' | 'FACEBOOK_COMMENT';

export type ScrapingJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  facebook_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  post_url: string;
  title: string;
  description: string;
  author_name: string;
  author_id: string;
  location?: string;
  phone?: string;
  price?: number; // Monthly rent in EUR
  lead_type: LeadType;
  intent_score?: number; // 1-10, only for OWNER leads
  is_agent: boolean; // Only relevant for OWNER leads
  status: LeadStatus;
  image_urls: string[]; // JSON array of image URLs
  images_downloaded: boolean;
  scrape_source?: string; // Source: 'FACEBOOK_MARKETPLACE', 'FACEBOOK_GROUP:GroupName', or 'UNKNOWN'
  created_at: string;
  updated_at: string;
}

export interface GroupConfig {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  owner_only: boolean;
  exclude_agents: boolean;
  minimum_intent_score: number;
  created_at: string;
  updated_at: string;
}

export interface LeadImage {
  id: string;
  lead_id: string;
  storage_path: string;
  url: string;
  created_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  template_type: MessageTemplateType;
  message_text: string;
  sent_at?: string;
  created_at: string;
}

export interface ScrapingJob {
  id: string;
  source: string; // 'MARKETPLACE' | 'GROUP'
  status: ScrapingJobStatus;
  leads_found: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}
