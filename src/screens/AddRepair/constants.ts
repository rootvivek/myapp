import { CardSim, SmartphoneCharging } from 'lucide-react-native';

export const COMMON_PROBLEMS = [
  'Folder replace',
  'Battery change',
  'Charging issue',
  'Network repair',
  'FRP lock',
  'Software',
  'Touch change',
  'Speaker issue',
] as const;

export const DEVICE_BRANDS = [
  'Samsung',
  'Iphone',
  'Mi',
  'Redmi',
  'POCO',
  'Realme',
  'Oppo',
  'Vivo',
  'Nothing',
  'OnePlus',
  'Motorola',
  'Google Pixel',
  'Nokia',
  'IQOO',
  'Infinix',
  'Tecno',
  'Lava',
  'Micromax',
  'Asus',
  'Sony',
  'Huawei',
  'Honor',
] as const;

export const WARRANTY_OPTIONS = [
  { label: 'None', type: 'none' as const, value: 'No Warranty' },
  { label: '30 Days', type: '30' as const, value: '30 Days' },
  { label: '90 Days', type: '90' as const, value: '90 Days' },
  { label: '180 Days', type: '180' as const, value: '180 Days' },
  { label: 'Custom', type: 'custom' as const, value: '' },
] as const;

export const ACCESSORY_UI = [
  { icon: CardSim, title: 'SIM tray', key: 'accSimTray' as const },
  { icon: SmartphoneCharging, title: 'Back cover', key: 'accBackCover' as const },
] as const;
