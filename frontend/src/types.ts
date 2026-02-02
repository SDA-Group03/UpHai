  export interface ModelData {
    id: string;
    name: string;
    provider: string;
    description: string;
    price: string;
    tags: string[];
    iconUrl: string;
    isDeprecated?: boolean;
  }

  export interface FilterOption {
    label: string;
    value: string;
    isActive?: boolean;
  }