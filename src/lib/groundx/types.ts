// src/lib/groundx/types.ts
export interface GroundXSearchResponse {
    body: {
      search: {
        results: Array<{
          sourceUrl: string;
          boundingBoxes: Array<{
            pageNumber: number;
          }>;
        }>;
        text: string;  // RAG context
      };
    };
  }
  
  export interface GroundXConfig {
    apiKey: string;
    baseUrl?: string;
  }