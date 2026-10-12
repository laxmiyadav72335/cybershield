/** Which third-party integrations are configured. Shown on /api/health and used by services. */
export const hasKey = (name) => Boolean(process.env[name] && process.env[name].trim());

export const configStatus = () => ({
  virusTotal: hasKey('VIRUSTOTAL_API_KEY'),
  safeBrowsing: hasKey('SAFE_BROWSING_API_KEY'),
  gemini: hasKey('GEMINI_API_KEY'),
  abuseIpdb: hasKey('ABUSEIPDB_API_KEY'),
});
