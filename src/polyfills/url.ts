// Polyfills for React Native / Hermes
// Must be imported before any code that uses URL/fetch (like Supabase)
import 'react-native-url-polyfill/auto';

// Fix DataView.prototype.isPrototypeOf for whatwg-fetch
if (typeof DataView !== 'undefined' && DataView.prototype) {
  if (typeof DataView.prototype.isPrototypeOf !== 'function') {
    DataView.prototype.isPrototypeOf = function(obj) {
      return obj instanceof DataView;
    };
  }
}

// Fix ArrayBuffer.prototype.isPrototypeOf
if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.prototype) {
  if (typeof ArrayBuffer.prototype.isPrototypeOf !== 'function') {
    ArrayBuffer.prototype.isPrototypeOf = function(obj) {
      return obj instanceof ArrayBuffer;
    };
  }
}

// Fix Blob.prototype.isPrototypeOf
if (typeof Blob !== 'undefined' && Blob.prototype) {
  if (typeof Blob.prototype.isPrototypeOf !== 'function') {
    Blob.prototype.isPrototypeOf = function(obj) {
      return obj instanceof Blob;
    };
  }
}

// Fix FormData.prototype.isPrototypeOf
if (typeof FormData !== 'undefined' && FormData.prototype) {
  if (typeof FormData.prototype.isPrototypeOf !== 'function') {
    FormData.prototype.isPrototypeOf = function(obj) {
      return obj instanceof FormData;
    };
  }
}