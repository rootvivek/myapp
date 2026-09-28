import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-vision-camera', () => ({
  useCameraDevices: () => [],
  useCameraDevice: () => null,
  useCameraFormat: () => null,
  useFrameProcessor: () => null,
  Camera: 'Camera',
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-share', () => ({
  share: jest.fn(),
}));

jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn().mockResolvedValue({ filePath: '/mock/path.pdf' }),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    rpc: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
  })),
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const RealPaper = jest.requireActual('react-native-paper');
  return {
    ...RealPaper,
    Portal: ({ children }) => children,
  };
});

// Suppress specific warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});