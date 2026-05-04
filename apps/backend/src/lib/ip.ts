import { isIP } from "node:net";

export interface ParsedCidr {
  family: 4 | 6;
  prefix: number;
  baseIp: string;
  networkIp: string;
  start: bigint;
  end: bigint;
  normalized: string;
}

function stripWrapping(input: string) {
  return input.trim().replace(/^for=/i, "").replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
}

function maybeStripPort(input: string) {
  if (input.startsWith("[") && input.includes("]")) {
    return input.slice(1, input.indexOf("]"));
  }

  if (input.includes(".") && input.includes(":") && input.indexOf(":") === input.lastIndexOf(":")) {
    return input.slice(0, input.lastIndexOf(":"));
  }

  return input;
}

function ipv4ToBytes(ip: string) {
  return ip.split(".").map((part) => Number(part));
}

function ipv6ToBytes(ip: string) {
  let normalized = ip.toLowerCase();

  if (normalized.includes(".")) {
    const lastColonIndex = normalized.lastIndexOf(":");
    const ipv4Part = normalized.slice(lastColonIndex + 1);
    const ipv4Bytes = ipv4ToBytes(ipv4Part);
    const [first = 0, second = 0, third = 0, fourth = 0] = ipv4Bytes;
    normalized = `${normalized.slice(0, lastColonIndex)}:${((first << 8) | second).toString(16)}:${((third << 8) | fourth).toString(16)}`;
  }

  const parts = normalized.split("::");
  if (parts.length > 2) {
    throw new Error("Invalid IPv6 address");
  }

  const head = parts[0]?.split(":").filter(Boolean) ?? [];
  const tail = parts[1]?.split(":").filter(Boolean) ?? [];
  const fillCount = 8 - (head.length + tail.length);
  const groups = [
    ...head,
    ...Array.from({ length: Math.max(fillCount, 0) }, () => "0"),
    ...tail
  ];

  if (groups.length !== 8) {
    throw new Error("Invalid IPv6 address");
  }

  return groups.flatMap((group) => {
    const value = Number.parseInt(group, 16);
    return [(value >> 8) & 0xff, value & 0xff];
  });
}

function ipToBytes(ip: string): { family: 4 | 6; bytes: number[] } {
  const family = isIP(ip);
  if (family === 4) {
    return { family, bytes: ipv4ToBytes(ip) };
  }

  if (family === 6) {
    return { family, bytes: ipv6ToBytes(ip) };
  }

  throw new Error("Invalid IP address");
}

function bytesToBigInt(bytes: number[]) {
  return bytes.reduce((value, part) => (value << 8n) + BigInt(part), 0n);
}

function bytesToIpv4(bytes: number[]) {
  return bytes.join(".");
}

function bytesToIpv6(bytes: number[]) {
  const groups = Array.from({ length: 8 }, (_, index) =>
    ((((bytes[index * 2] ?? 0) << 8) | (bytes[index * 2 + 1] ?? 0))).toString(16)
  );

  let bestStart = -1;
  let bestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  groups.forEach((group, index) => {
    if (group === "0") {
      if (currentStart === -1) {
        currentStart = index;
        currentLength = 1;
      } else {
        currentLength += 1;
      }

      if (currentLength > bestLength) {
        bestStart = currentStart;
        bestLength = currentLength;
      }
      return;
    }

    currentStart = -1;
    currentLength = 0;
  });

  if (bestLength < 2) {
    return groups.join(":");
  }

  const left = groups.slice(0, bestStart).join(":");
  const right = groups.slice(bestStart + bestLength).join(":");

  if (!left && !right) {
    return "::";
  }

  if (!left) {
    return `::${right}`;
  }

  if (!right) {
    return `${left}::`;
  }

  return `${left}::${right}`;
}

function bytesToIp(bytes: number[], family: 4 | 6) {
  return family === 4 ? bytesToIpv4(bytes) : bytesToIpv6(bytes);
}

function maskBytes(bytes: number[], prefix: number) {
  const masked = [...bytes];
  let remainingBits = prefix;

  for (let index = 0; index < masked.length; index += 1) {
    if (remainingBits >= 8) {
      remainingBits -= 8;
      continue;
    }

    if (remainingBits <= 0) {
      masked[index] = 0;
      continue;
    }

    masked[index] = (masked[index] ?? 0) & ((0xff << (8 - remainingBits)) & 0xff);
    remainingBits = 0;
  }

  return masked;
}

function normalizeRawIp(input: string) {
  const stripped = maybeStripPort(stripWrapping(input)).replace(/%.*$/, "");

  if (!stripped || stripped.toLowerCase() === "unknown") {
    return null;
  }

  if (stripped.startsWith("::ffff:")) {
    const mappedIpv4 = stripped.slice("::ffff:".length);
    if (isIP(mappedIpv4) === 4) {
      return mappedIpv4;
    }
  }

  return stripped;
}

export function normalizeIp(input?: string | null) {
  if (!input) {
    return null;
  }

  const raw = normalizeRawIp(input);
  if (!raw) {
    return null;
  }

  const parsed = ipToBytes(raw);
  return bytesToIp(parsed.bytes, parsed.family);
}

export function parseCidr(input?: string | null): ParsedCidr | null {
  if (!input) {
    return null;
  }

  const [rawBase, rawPrefix] = input.trim().split("/");
  if (!rawBase || rawPrefix === undefined) {
    return null;
  }

  const baseIp = normalizeIp(rawBase);
  if (!baseIp) {
    return null;
  }

  const parsed = ipToBytes(baseIp);
  const prefix = Number.parseInt(rawPrefix, 10);
  const totalBits = parsed.family === 4 ? 32 : 128;

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > totalBits) {
    return null;
  }

  const networkBytes = maskBytes(parsed.bytes, prefix);
  const start = bytesToBigInt(networkBytes);
  const hostBits = BigInt(totalBits - prefix);
  const end = start + ((1n << hostBits) - 1n);
  const networkIp = bytesToIp(networkBytes, parsed.family);

  return {
    family: parsed.family,
    prefix,
    baseIp,
    networkIp,
    start,
    end,
    normalized: `${networkIp}/${prefix}`
  };
}

export function normalizeCidr(input?: string | null) {
  return parseCidr(input)?.normalized ?? null;
}

export function isIpInCidr(ip: string, cidr: string) {
  const normalizedIp = normalizeIp(ip);
  const parsedCidr = parseCidr(cidr);

  if (!normalizedIp || !parsedCidr) {
    return false;
  }

  const parsedIp = ipToBytes(normalizedIp);
  if (parsedIp.family !== parsedCidr.family) {
    return false;
  }

  const value = bytesToBigInt(parsedIp.bytes);
  return value >= parsedCidr.start && value <= parsedCidr.end;
}

export function cidrOverlaps(first: string, second: string) {
  const left = parseCidr(first);
  const right = parseCidr(second);

  if (!left || !right || left.family !== right.family) {
    return false;
  }

  return left.start <= right.end && right.start <= left.end;
}

export function isPrivateIp(ip: string) {
  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) {
    return false;
  }

  if (isIpInCidr(normalizedIp, "10.0.0.0/8")) return true;
  if (isIpInCidr(normalizedIp, "172.16.0.0/12")) return true;
  if (isIpInCidr(normalizedIp, "192.168.0.0/16")) return true;
  if (isIpInCidr(normalizedIp, "127.0.0.0/8")) return true;
  if (isIpInCidr(normalizedIp, "169.254.0.0/16")) return true;
  if (isIpInCidr(normalizedIp, "100.64.0.0/10")) return true;
  if (isIpInCidr(normalizedIp, "::1/128")) return true;
  if (isIpInCidr(normalizedIp, "fc00::/7")) return true;
  if (isIpInCidr(normalizedIp, "fe80::/10")) return true;

  return false;
}
