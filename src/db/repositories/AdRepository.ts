/**
 * Ad Repository
 * Database operations for ads across all platforms
 */

import { sql } from '@vercel/postgres';

export interface Ad {
  id: string;
  platform: string;
  campaign_id: string;
  ad_group_id: string;
  name: string;
  status: string;
  creative_data?: any;
  platform_specific_data?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateAdInput {
  id: string;
  platform: string;
  campaign_id: string;
  ad_group_id: string;
  name: string;
  status: string;
  creative_data?: any;
  platform_specific_data?: any;
}

export interface UpdateAdInput {
  name?: string;
  status?: string;
  creative_data?: any;
  platform_specific_data?: any;
}

export class AdRepository {
  /**
   * Create a new ad
   */
  async create(ad: CreateAdInput): Promise<Ad> {
    try {
      const result = await sql`
        INSERT INTO ads (
          id, platform, campaign_id, ad_group_id, name, status,
          creative_data, platform_specific_data
        ) VALUES (
          ${ad.id},
          ${ad.platform},
          ${ad.campaign_id},
          ${ad.ad_group_id},
          ${ad.name},
          ${ad.status},
          ${JSON.stringify(ad.creative_data || {})}::jsonb,
          ${JSON.stringify(ad.platform_specific_data || {})}::jsonb
        )
        RETURNING *
      `;

      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error creating ad:', error);
      throw new Error(`Failed to create ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find ad by ID
   */
  async findById(id: string): Promise<Ad | null> {
    try {
      const result = await sql`
        SELECT * FROM ads
        WHERE id = ${id}
      `;

      return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding ad by ID:', error);
      throw new Error(`Failed to find ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find ads by campaign ID
   */
  async findByCampaignId(campaignId: string): Promise<Ad[]> {
    try {
      const result = await sql`
        SELECT * FROM ads
        WHERE campaign_id = ${campaignId}
        ORDER BY created_at DESC
      `;

      return result.rows.map(row => this.mapRow(row));
    } catch (error) {
      console.error('Error finding ads by campaign ID:', error);
      throw new Error(`Failed to find ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find ads by ad group ID
   */
  async findByAdGroupId(adGroupId: string): Promise<Ad[]> {
    try {
      const result = await sql`
        SELECT * FROM ads
        WHERE ad_group_id = ${adGroupId}
        ORDER BY created_at DESC
      `;

      return result.rows.map(row => this.mapRow(row));
    } catch (error) {
      console.error('Error finding ads by ad group ID:', error);
      throw new Error(`Failed to find ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find ads by platform
   */
  async findByPlatform(
    platform: string,
    filters?: { status?: string; limit?: number; offset?: number }
  ): Promise<Ad[]> {
    try {
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      let query;
      if (filters?.status) {
        query = await sql`
          SELECT * FROM ads
          WHERE platform = ${platform}
          AND status = ${filters.status}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        query = await sql`
          SELECT * FROM ads
          WHERE platform = ${platform}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }

      return query.rows.map(row => this.mapRow(row));
    } catch (error) {
      console.error('Error finding ads by platform:', error);
      throw new Error(`Failed to find ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update ad
   */
  async update(id: string, updates: UpdateAdInput): Promise<Ad | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.creative_data !== undefined) {
        updateFields.push(`creative_data = $${paramIndex++}`);
        values.push(JSON.stringify(updates.creative_data));
      }
      if (updates.platform_specific_data !== undefined) {
        updateFields.push(`platform_specific_data = $${paramIndex++}`);
        values.push(JSON.stringify(updates.platform_specific_data));
      }

      // Always update updated_at
      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length === 1) { // Only updated_at
        return existing;
      }

      values.push(id);
      const query = `
        UPDATE ads
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await sql.query(query, values);
      return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating ad:', error);
      throw new Error(`Failed to update ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete ad (soft delete by updating status)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE ads
        SET status = 'DELETED', updated_at = NOW()
        WHERE id = ${id}
        RETURNING id
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw new Error(`Failed to delete ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Hard delete ad (permanently remove from database)
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM ads
        WHERE id = ${id}
        RETURNING id
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error hard deleting ad:', error);
      throw new Error(`Failed to hard delete ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count ads by campaign
   */
  async countByCampaign(campaignId: string): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM ads
        WHERE campaign_id = ${campaignId}
      `;

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting ads:', error);
      throw new Error(`Failed to count ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count ads by ad group
   */
  async countByAdGroup(adGroupId: string): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM ads
        WHERE ad_group_id = ${adGroupId}
      `;

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting ads by ad group:', error);
      throw new Error(`Failed to count ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch create ads
   */
  async createBatch(ads: CreateAdInput[]): Promise<Ad[]> {
    try {
      const created: Ad[] = [];

      for (const ad of ads) {
        const result = await this.create(ad);
        created.push(result);
      }

      return created;
    } catch (error) {
      console.error('Error batch creating ads:', error);
      throw new Error(`Failed to batch create ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all ads for a campaign
   */
  async deleteByCampaignId(campaignId: string): Promise<number> {
    try {
      const result = await sql`
        UPDATE ads
        SET status = 'DELETED', updated_at = NOW()
        WHERE campaign_id = ${campaignId}
        RETURNING id
      `;

      return result.rows.length;
    } catch (error) {
      console.error('Error deleting ads by campaign:', error);
      throw new Error(`Failed to delete ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all ads for an ad group
   */
  async deleteByAdGroupId(adGroupId: string): Promise<number> {
    try {
      const result = await sql`
        UPDATE ads
        SET status = 'DELETED', updated_at = NOW()
        WHERE ad_group_id = ${adGroupId}
        RETURNING id
      `;

      return result.rows.length;
    } catch (error) {
      console.error('Error deleting ads by ad group:', error);
      throw new Error(`Failed to delete ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map database row to Ad object
   */
  private mapRow(row: any): Ad {
    return {
      id: row.id,
      platform: row.platform,
      campaign_id: row.campaign_id,
      ad_group_id: row.ad_group_id,
      name: row.name,
      status: row.status,
      creative_data: row.creative_data || {},
      platform_specific_data: row.platform_specific_data || {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}
