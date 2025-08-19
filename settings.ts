// settings.ts

export interface Md2WechatSettings {
  apiKey: string;
  theme: string;
  fontSize: 'small' | 'medium' | 'large';
}

export const DEFAULT_SETTINGS: Md2WechatSettings = {
  apiKey: '',
  theme: 'default',
  fontSize: 'medium',
};