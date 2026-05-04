import type { AppEnv } from "../config/env.js";
import { isPrivateIp, normalizeIp } from "../lib/ip.js";

export interface GeoIpLookupResult {
  country: string | null;
  city: string | null;
  region: string | null;
  asn: string | null;
  provider: string | null;
}

export interface GeoIpService {
  lookup(ipAddress: string): Promise<GeoIpLookupResult | null>;
}

function getStringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function buildLookupUrl(provider: string, apiUrl: string, ipAddress: string) {
  const baseUrl = apiUrl.trim() || (provider === "ipwhois" ? "https://ipwho.is/{ip}" : "");
  if (!baseUrl) {
    return null;
  }

  if (baseUrl.includes("{ip}")) {
    return baseUrl.replaceAll("{ip}", encodeURIComponent(ipAddress));
  }

  const url = new URL(baseUrl);
  if (!url.searchParams.has("ip")) {
    url.searchParams.set("ip", ipAddress);
  }

  return url.toString();
}

function normalizeGeoResult(providerName: string, payload: any): GeoIpLookupResult | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const country = getStringValue(payload.country_name, payload.country, payload.location?.country);
  const city = getStringValue(payload.city, payload.location?.city);
  const region = getStringValue(payload.region, payload.region_name, payload.location?.region);
  const asn = getStringValue(
    payload.asn,
    payload.connection?.asn,
    payload.network?.asn,
    payload.org?.asn
  );
  const provider = getStringValue(
    payload.isp,
    payload.provider,
    payload.org,
    payload.connection?.isp,
    payload.connection?.org,
    payload.connection?.organization,
    payload.network?.name
  );

  if (!country && !city && !region && !asn && !provider) {
    return null;
  }

  return {
    country,
    city,
    region,
    asn,
    provider: provider ?? providerName
  };
}

export function createGeoIpService(env: AppEnv): GeoIpService {
  return {
    async lookup(ipAddress: string) {
      const normalizedIp = normalizeIp(ipAddress);
      if (!normalizedIp || env.GEOIP_PROVIDER === "none" || isPrivateIp(normalizedIp)) {
        return null;
      }

      const url = buildLookupUrl(env.GEOIP_PROVIDER, env.GEOIP_API_URL, normalizedIp);
      if (!url) {
        return null;
      }

      try {
        const headers = new Headers();

        if (env.GEOIP_API_KEY) {
          headers.set("Authorization", `Bearer ${env.GEOIP_API_KEY}`);
          headers.set("X-API-Key", env.GEOIP_API_KEY);
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        return normalizeGeoResult(env.GEOIP_PROVIDER, payload);
      } catch {
        return null;
      }
    }
  };
}
