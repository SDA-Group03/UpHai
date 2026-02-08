  export interface ModelData {
      id: string;
      name: string;
      displayName: string;
      description: string | null;
      category: string;
      series: string | null;
      performanceTier: string | null;
      engine: string;
      sizeMb: number;
      iconUrl: string | null;
      createdAt: string;
    }
  
    export interface FilterOption {
      label: string;
      value: string;
      isActive?: boolean;
    }
  
    export interface Message {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      images?: string[];
      timestamp: number;
    }