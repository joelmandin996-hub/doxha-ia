import RNEventSource from 'react-native-sse';

// Hermes has no built-in EventSource, but the PocketBase JS SDK's realtime
// client assumes a global one exists (`new EventSource(url)`, plus a direct
// `.onerror =` property assignment alongside its `addEventListener` calls).
// react-native-sse only supports addEventListener, so the `onerror` setter
// below bridges that one gap.
class PocketBaseEventSource extends RNEventSource {
  set onerror(fn) {
    this.addEventListener('error', fn);
  }
}

export function installEventSourcePolyfill() {
  if (typeof global.EventSource === 'undefined') {
    global.EventSource = PocketBaseEventSource;
  }
}
