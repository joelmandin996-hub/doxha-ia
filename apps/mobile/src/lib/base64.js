// Hermes doesn't expose btoa/TextEncoder consistently across RN versions,
// so base64-encoding an arbitrary UTF-8 string needs a manual, dependency-free
// implementation rather than relying on web globals.
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8Bytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i);
    if (code > 0xffff) i++;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return bytes;
}

export function base64EncodeUtf8(str) {
  const bytes = utf8Bytes(str);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    const triplet = (b1 << 16) | ((b2 || 0) << 8) | (b3 || 0);
    result += CHARS[(triplet >> 18) & 0x3f];
    result += CHARS[(triplet >> 12) & 0x3f];
    result += i + 1 < bytes.length ? CHARS[(triplet >> 6) & 0x3f] : '=';
    result += i + 2 < bytes.length ? CHARS[triplet & 0x3f] : '=';
  }
  return result;
}
