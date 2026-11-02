import { BlockList, isIP } from 'node:net';

/**
 * Cloudflare's address ranges, from https://www.cloudflare.com/ips/ (checked on 2026-11-02). The
 * list rarely changes. If Cloudflare adds a range, visitors arriving through it count as the
 * Cloudflare address in the rate limit, not as themselves, until the range is added here.
 */
const IPV4 = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];
const IPV6 = ['2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'];

const ranges = new BlockList();
for (const [list, type] of [[IPV4, 'ipv4'], [IPV6, 'ipv6']] as const) {
  for (const cidr of list) {
    const [network, prefix] = cidr.split('/');
    ranges.addSubnet(network, Number(prefix), type);
  }
}

/** True when `ip` (IPv4, IPv6 or IPv4-mapped IPv6) belongs to Cloudflare; false for anything that is not an IP. */
export function isCloudflareIp(ip: string) {
  const family = isIP(ip);
  return family !== 0 && ranges.check(ip, family === 4 ? 'ipv4' : 'ipv6');
}
