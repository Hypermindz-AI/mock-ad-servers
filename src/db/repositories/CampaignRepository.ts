import { sql } from '@vercel/postgres';

export interface Campaign {
  id: string;
  platform: string;
  account_id: string;
  name: string;
  objective?: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_date?: Date;
  end_date?: Date;
  platform_specific_data?: any;
  created_at?: Date;
  updated_at?: Date;
}

export class CampaignRepository {
  /**
   * Create campaign
   */
  async create(campaign: Campaign): Promise<Campaign> {
    const result = await sql`
      INSERT INTO campaigns (
        id, platform, account_id, name, objective, status,
        daily_budget, lifetime_budget, start_date, end_date,
        platform_specific_data
      ) VALUES (
        ${campaign.id}, ${campaign.platform}, ${campaign.account_id},
        ${campaign.name}, ${campaign.objective || null}, ${campaign.status},
        ${campaign.daily_budget || null}, ${campaign.lifetime_budget || null},
        ${campaign.start_date || null}, ${campaign.end_date || null},
        ${JSON.stringify(campaign.platform_specific_data || {})}
      )
      RETURNING *
    `;

    return this.mapRow(result.rows[0]);
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<Campaign | null> {
    const result = await sql`
      SELECT * FROM campaigns WHERE id = ${id}
    `;

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Find by account ID
   */
  async findByAccountId(platform: string, accountId: string): Promise<Campaign[]> {
    const result = await sql`
      SELECT * FROM campaigns
      WHERE platform = ${platform}
      AND account_id = ${accountId}
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Update campaign
   */
  async update(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const setClauses: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'platform' && key !== 'account_id' && key !== 'created_at') {
        setClauses.push(`${key} = $${values.length + 1}`);
        values.push(key === 'platform_specific_data' ? JSON.stringify(value) : value);
      }
    });

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE campaigns
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Map database row to Campaign object
   */
  private mapRow(row: any): Campaign {
    return {
      id: row.id,
      platform: row.platform,
      account_id: row.account_id,
      name: row.name,
      objective: row.objective,
      status: row.status,
      daily_budget: row.daily_budget ? parseFloat(row.daily_budget) : undefined,
      lifetime_budget: row.lifetime_budget ? parseFloat(row.lifetime_budget) : undefined,
      start_date: row.start_date ? new Date(row.start_date) : undefined,
      end_date: row.end_date ? new Date(row.end_date) : undefined,
      platform_specific_data: row.platform_specific_data,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}
