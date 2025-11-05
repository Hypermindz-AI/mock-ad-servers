/**
 * Ad Group Repository
 * Database operations for ad groups/ad sets across all platforms
 */

import { sql } from '@vercel/postgres';

export interface AdGroup {
  id: string;
  platform: string;
  campaign_id: string;
  name: string;
  status: string;
  optimization_goal?: string;
  bid_amount?: number;
  daily_budget?: number;
  targeting?: any;
  platform_specific_data?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateAdGroupInput {
  id: string;
  platform: string;
  campaign_id: string;
  name: string;
  status: string;
  optimization_goal?: string;
  bid_amount?: number;
  daily_budget?: number;
  targeting?: any;
  platform_specific_data?: any;
}

export interface UpdateAdGroupInput {
  name?: string;
  status?: string;
  optimization_goal?: string;
  bid_amount?: number;
  daily_budget?: number;
  targeting?: any;
  platform_specific_data?: any;
}

export class AdGroupRepository {
  /**
   * Create a new ad group
   */
  async create(adGroup: CreateAdGroupInput): Promise<AdGroup> {
    try {
      const result = await sql`
        INSERT INTO ad_groups (
          id, platform, campaign_id, name, status,
          optimization_goal, bid_amount, daily_budget,
          targeting, platform_specific_data
        ) VALUES (
          ${adGroup.id},
          ${adGroup.platform},
          ${adGroup.campaign_id},
          ${adGroup.name},
          ${adGroup.status},
          ${adGroup.optimization_goal || null},
          ${adGroup.bid_amount || null},
          ${adGroup.daily_budget || null},
          ${JSON.stringify(adGroup.targeting || {})}::jsonb,
          ${JSON.stringify(adGroup.platform_specific_data || {})}::jsonb
        )
        RETURNING *
      `;

      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error creating ad group:', error);
      throw new Error(`Failed to create ad group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find ad group by ID
   */
  async findById(id: string): Promise<AdGroup | null> {
    try {
      const result = await sql`
        SELECT * FROM ad_groups
        WHERE id = ${id}
      `;

      return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding ad group by ID:', error);
      throw new Error(`Failed to find ad group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find ad groups by campaign ID
   */
  async findByCampaignId(campaignId: string): Promise<AdGroup[]> {
    try {
      const result = await sql`
        SELECT * FROM ad_groups
        WHERE campaign_id = ${campaignId}
        ORDER BY created_at DESC
      `;

      return result.rows.map(row => this.mapRow(row));
    } catch (error) {
      console.error('Error finding ad groups by campaign ID:', error);
      throw new Error(`Failed to find ad groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find ad groups by platform
   */
  async findByPlatform(
    platform: string,
    filters?: { status?: string; limit?: number; offset?: number }
  ): Promise<AdGroup[]> {
    try {
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      let query;
      if (filters?.status) {
        query = await sql`
          SELECT * FROM ad_groups
          WHERE platform = ${platform}
          AND status = ${filters.status}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        query = await sql`
          SELECT * FROM ad_groups
          WHERE platform = ${platform}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }

      return query.rows.map(row => this.mapRow(row));
    } catch (error) {
      console.error('Error finding ad groups by platform:', error);
      throw new Error(`Failed to find ad groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update ad group
   */
  async update(id: string, updates: UpdateAdGroupInput): Promise<AdGroup | null> {
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
      if (updates.optimization_goal !== undefined) {
        updateFields.push(`optimization_goal = $${paramIndex++}`);
        values.push(updates.optimization_goal);
      }
      if (updates.bid_amount !== undefined) {
        updateFields.push(`bid_amount = $${paramIndex++}`);
        values.push(updates.bid_amount);
      }
      if (updates.daily_budget !== undefined) {
        updateFields.push(`daily_budget = $${paramIndex++}`);
        values.push(updates.daily_budget);
      }
      if (updates.targeting !== undefined) {
        updateFields.push(`targeting = $${paramIndex++}`);
        values.push(JSON.stringify(updates.targeting));
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
        UPDATE ad_groups
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await sql.query(query, values);
      return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating ad group:', error);
      throw new Error(`Failed to update ad group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete ad group (soft delete by updating status)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE ad_groups
        SET status = 'DELETED', updated_at = NOW()
        WHERE id = ${id}
        RETURNING id
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting ad group:', error);
      throw new Error(`Failed to delete ad group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Hard delete ad group (permanently remove from database)
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM ad_groups
        WHERE id = ${id}
        RETURNING id
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error hard deleting ad group:', error);
      throw new Error(`Failed to hard delete ad group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count ad groups by campaign
   */
  async countByCampaign(campaignId: string): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM ad_groups
        WHERE campaign_id = ${campaignId}
      `;

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting ad groups:', error);
      throw new Error(`Failed to count ad groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch create ad groups
   */
  async createBatch(adGroups: CreateAdGroupInput[]): Promise<AdGroup[]> {
    try {
      const created: AdGroup[] = [];

      for (const adGroup of adGroups) {
        const result = await this.create(adGroup);
        created.push(result);
      }

      return created;
    } catch (error) {
      console.error('Error batch creating ad groups:', error);
      throw new Error(`Failed to batch create ad groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all ad groups for a campaign
   */
  async deleteByCampaignId(campaignId: string): Promise<number> {
    try {
      const result = await sql`
        UPDATE ad_groups
        SET status = 'DELETED', updated_at = NOW()
        WHERE campaign_id = ${campaignId}
        RETURNING id
      `;

      return result.rows.length;
    } catch (error) {
      console.error('Error deleting ad groups by campaign:', error);
      throw new Error(`Failed to delete ad groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map database row to AdGroup object
   */
  private mapRow(row: any): AdGroup {
    return {
      id: row.id,
      platform: row.platform,
      campaign_id: row.campaign_id,
      name: row.name,
      status: row.status,
      optimization_goal: row.optimization_goal,
      bid_amount: row.bid_amount ? parseFloat(row.bid_amount) : undefined,
      daily_budget: row.daily_budget ? parseFloat(row.daily_budget) : undefined,
      targeting: row.targeting || {},
      platform_specific_data: row.platform_specific_data || {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}
