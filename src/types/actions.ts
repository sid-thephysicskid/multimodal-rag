// src/types/actions.ts
export interface Action {
    scroll_up?: boolean;
    scroll_down?: boolean;
    next_page?: boolean;
    previous_page?: boolean;
    snap_page?: boolean;
    find_fig?: boolean;
    find_pdf?: boolean;
    non_determ?: boolean;
    query?: string;
    context?: any;
    page?: number;
    does_follow_up?: boolean;
    pdf?: string;
  }
  
  export interface SnapPage {
    snap_page: number;
  }
  
  export interface FigDesc {
    figure_description: string;
  }
  
  export interface DocDesc {
    doc_description: string;
  }
  
  export interface VerbalResponse {
    immediate_response: string;
    followup_response: boolean;
  }