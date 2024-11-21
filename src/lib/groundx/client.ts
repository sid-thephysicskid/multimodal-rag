// src/lib/groundx/client.ts
import axios from 'axios';
import { GroundXSearchResponse, GroundXConfig } from './types';

export class GroundX {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: GroundXConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.groundx.ai';
  }

  async searchContent(bucketId: string | number, query: string): Promise<GroundXSearchResponse> {
    try {
      const response = await axios.post<GroundXSearchResponse>(
        `${this.baseUrl}/search/content`,
        {
          id: bucketId,
          query,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('GroundX search error:', error.response?.data);
        throw new Error(`GroundX search failed: ${error.message}`);
      }
      throw error;
    }
  }
}