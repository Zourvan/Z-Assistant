export interface CidrInfo {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  hostCount: number;
  prefix: number;
  subnetMask: string;
}

const ipToInt = (ip: string): number | null => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
};

const intToIp = (n: number): string => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");

export const parseCidr = (input: string): CidrInfo | null => {
  const match = input.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (!match) return null;
  const ipInt = ipToInt(match[1]);
  const prefix = Number(match[2]);
  if (ipInt === null || prefix < 0 || prefix > 32) return null;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | (~mask >>> 0)) >>> 0;
  const hostCount = prefix >= 31 ? (prefix === 32 ? 1 : 2) : broadcastInt - networkInt - 1;
  const firstHostInt = prefix >= 31 ? networkInt : networkInt + 1;
  const lastHostInt = prefix >= 31 ? broadcastInt : broadcastInt - 1;

  return {
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    hostCount: Math.max(0, hostCount),
    prefix,
    subnetMask: intToIp(mask),
  };
};

export const ipToNumber = (ip: string): string | null => {
  const n = ipToInt(ip);
  return n === null ? null : String(n);
};

export const numberToIp = (num: string): string | null => {
  const n = Number(num);
  if (!Number.isInteger(n) || n < 0 || n > 4294967295) return null;
  return intToIp(n >>> 0);
};

export const calcSubnet = (ip: string, prefix: number): CidrInfo | null => parseCidr(`${ip}/${prefix}`);
