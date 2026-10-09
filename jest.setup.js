// NOTE: this file is loaded untranspiled by Jest, so it must use CommonJS
// (`require`) rather than ESM `import`.
//
// Matchers (toBeVisible, etc.) are built into @testing-library/react-native v12.4+,
// so the deprecated `@testing-library/jest-native/extend-expect` is not needed.
// `react-native-gesture-handler` is not a dependency of this project either.

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

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-share', () => ({
  share: jest.fn(),
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