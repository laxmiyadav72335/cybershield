/**
 * Browser-side hashing with the Web Crypto API.
 * sha256Hex(file) powers the "hash-first" file lookup: we can ask VirusTotal
 * whether a file is known WITHOUT uploading it, using only its fingerprint.
 */
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(fileOrBlob) {
  const data = await fileOrBlob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

/** Used by the password checker (Phase 4): SHA-1, UPPERCASE hex, as HIBP expects. */
export async function sha1HexUpper(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return toHex(digest).toUpperCase();
}
