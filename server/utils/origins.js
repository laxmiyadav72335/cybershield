/** Keep the two common loopback names equivalent for local development. */
export function allowedClientOrigins(configured = 'http://localhost:5173') {
  const origins = new Set(configured.split(',').map((origin) => origin.trim()).filter(Boolean));
  for (const origin of origins) {
    if (/^http:\/\/localhost(?::\d+)?$/.test(origin)) {
      origins.add(origin.replace('localhost', '127.0.0.1'));
    }
  }
  return [...origins];
}
