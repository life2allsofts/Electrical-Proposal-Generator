export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface StepConfig {
  step: number;
  title: string;
  description: string;
  fields: FormField[];
}

export interface Proposal {
  id: number;
  client_name: string;
  job_type: string;
  site_address: string;
  form_data: Record<string, any>;
  generated_content: string;
  created_at: string;
}

export interface UserSession {
  email: string;
  token: string;
  isAuthenticated: boolean;
}

export type ThemeType = 'default' | 'dark' | 'electrical-blue' | 'high-contrast';
