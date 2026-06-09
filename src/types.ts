export interface Station {
  id: string;
  name: string;
  frequency: string;
  url: string;
  color: string;
  logo?: string;
}

export type PlayerStatus = 'idle' | 'connecting' | 'live' | 'error' | 'skipping';
