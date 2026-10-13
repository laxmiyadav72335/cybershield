/** Browser-side IP validation aligned with the server's IPv4/IPv6 parser. */
const V4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

export function isValidIp(value) {
  if (V4.test(value)) return value.split('.').every((part) => part.length === 1 || !part.startsWith('0'));
  if (!value.includes(':') || !/^[0-9a-f:.]+$/i.test(value)) return false;
  try {
    return new URL(`http://[${value}]/`).hostname.startsWith('[');
  } catch {
    return false;
  }
}
