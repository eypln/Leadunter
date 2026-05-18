import { supabaseAdmin } from '@/lib/supabase/client';
import type { Lead, LeadType, LeadStatus } from '@/lib/supabase/types';

export class LeadRepository {
  /**
   * Get all leads with optional filters
   */
  async getLeads(filters?: {
    leadType?: LeadType;
    status?: LeadStatus;
    limit?: number;
    offset?: number;
  }) {
    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.leadType) {
      query = query.eq('lead_type', filters.leadType);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    return data as Lead[];
  }

  /**
   * Get a single lead by ID
   */
  async getLeadById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch lead: ${error.message}`);
    }

    return data as Lead;
  }

  /**
   * Create a new lead
   */
  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(lead)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create lead: ${error.message}`);
    }

    return data as Lead;
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: LeadStatus) {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lead status: ${error.message}`);
    }

    return data as Lead;
  }

  /**
   * Mark images as downloaded for a lead
   */
  async markImagesDownloaded(id: string) {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ images_downloaded: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark images as downloaded: ${error.message}`);
    }

    return data as Lead;
  }

  /**
   * Get lead statistics by type
   */
  async getLeadStats(leadType?: LeadType) {
    let query = supabaseAdmin
      .from('leads')
      .select('status', { count: 'exact' });

    if (leadType) {
      query = query.eq('lead_type', leadType);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch lead stats: ${error.message}`);
    }

    // Count by status
    const stats = {
      total: count || 0,
      new: 0,
      responded: 0,
      skipped: 0,
      interested: 0
    };

    data?.forEach((lead: any) => {
      const status = lead.status.toLowerCase();
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      }
    });

    return stats;
  }

  /**
   * Check if lead already exists by post URL
   */
  async leadExists(postUrl: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('post_url', postUrl)
      .single();

    return !error && !!data;
  }

  /**
   * Get leads by author (for agent detection)
   */
  async getLeadsByAuthor(authorId: string) {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('author_id', authorId)
      .eq('lead_type', 'OWNER');

    if (error) {
      throw new Error(`Failed to fetch leads by author: ${error.message}`);
    }

    return data as Lead[];
  }
}

// Export singleton instance
export const leadRepository = new LeadRepository();
