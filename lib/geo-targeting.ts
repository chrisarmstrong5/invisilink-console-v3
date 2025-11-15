/**
 * Geo-Targeting Utility
 *
 * Generates client-side geo-blocking scripts using ip-api.com
 * Ported from v2's GEO_TARGETING_IMPLEMENTATION.md
 *
 * Features:
 * - Multi-country targeting (23 Tier 1 countries)
 * - Fail-open behavior (if geo API is down, allow traffic)
 * - Caching to reduce API calls
 * - Fallback URL support
 */

import { config, type GeoTargetingCountry } from "./config";

export interface GeoTargetingOptions {
  enabled: boolean;
  targetCountries: string[]; // Array of country codes (e.g., ["US", "GB", "CA"])
  redirectUrl: string; // Where to redirect if NOT in target countries
  primaryUrl: string; // Where to redirect if IS in target countries
}

/**
 * Build geo-targeting script for injection into white page
 *
 * This script:
 * 1. Fetches user's country from ip-api.com
 * 2. Checks if country is in the allowed list
 * 3. Redirects to primaryUrl if allowed, redirectUrl if blocked
 * 4. Fails open (allows traffic) if API is down
 */
export function buildGeoTargetingScript(options: GeoTargetingOptions): string {
  if (!options.enabled || options.targetCountries.length === 0) {
    return "";
  }

  const { targetCountries, redirectUrl, primaryUrl } = options;
  const apiUrl = config.geoTargeting.apiUrl;

  const scriptBody = `(function() {
    try {
        const allowedCountries = ${JSON.stringify(targetCountries)};
        const fallbackUrl = ${JSON.stringify(redirectUrl)};
        const targetUrl = ${JSON.stringify(primaryUrl)};
        const geoApiUrl = ${JSON.stringify(apiUrl)};

        // Check if we already have cached geo data (valid for 1 hour)
        const cached = localStorage.getItem('geo_cache');
        const now = Date.now();

        if (cached) {
            try {
                const { countryCode, timestamp } = JSON.parse(cached);
                const cacheAge = now - timestamp;
                const oneHour = 60 * 60 * 1000;

                if (cacheAge < oneHour) {
                    // Use cached result
                    handleGeoResult(countryCode);
                    return;
                }
            } catch (e) {
                // Invalid cache, continue to fetch
            }
        }

        // Fetch geo data from ip-api.com
        fetch(geoApiUrl + '?fields=countryCode')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Geo API returned ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                const countryCode = data.countryCode;

                // Cache the result
                localStorage.setItem('geo_cache', JSON.stringify({
                    countryCode: countryCode,
                    timestamp: now
                }));

                handleGeoResult(countryCode);
            })
            .catch(error => {
                console.warn('Geo-targeting API failed, allowing traffic (fail-open):', error);
                // FAIL OPEN: If geo API is down, redirect to target URL
                window.location.replace(targetUrl);
            });

        function handleGeoResult(countryCode) {
            if (allowedCountries.includes(countryCode)) {
                // Country is allowed, redirect to primary URL
                window.location.replace(targetUrl);
            } else {
                // Country is NOT allowed, redirect to fallback
                window.location.replace(fallbackUrl);
            }
        }
    } catch (error) {
        console.error('Geo-targeting error:', error);
        // On any error, fail open and redirect to target
        window.location.replace(${JSON.stringify(primaryUrl)});
    }
})();`;

  return `<script>
${scriptBody}
</script>`;
}

/**
 * Get all available countries for geo-targeting
 */
export function getAvailableCountries(): GeoTargetingCountry[] {
  return config.geoTargeting.countries;
}

/**
 * Get countries grouped by region
 */
export function getCountriesByRegion(): Record<
  string,
  GeoTargetingCountry[]
> {
  const countries = getAvailableCountries();
  return {
    "English-speaking": countries.filter(
      (c) => c.region === "english-speaking"
    ),
    European: countries.filter((c) => c.region === "european"),
    Other: countries.filter((c) => c.region === "other"),
  };
}

/**
 * Validate country codes
 */
export function validateCountryCodes(codes: string[]): boolean {
  const validCodes = getAvailableCountries().map((c) => c.code);
  return codes.every((code) => validCodes.includes(code));
}

/**
 * Get country names from codes
 */
export function getCountryNames(codes: string[]): string[] {
  const countries = getAvailableCountries();
  return codes
    .map((code) => {
      const country = countries.find((c) => c.code === code);
      return country ? country.name : null;
    })
    .filter((name): name is string => name !== null);
}

/**
 * Format country list for display
 * Example: "US, GB, CA" -> "United States, United Kingdom, Canada"
 */
export function formatCountryList(codes: string[]): string {
  const names = getCountryNames(codes);
  if (names.length === 0) return "None";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}

/**
 * Build geo-targeting badge text for UI
 */
export function buildGeoBadge(countries: string[]): string {
  if (countries.length === 0) return "";
  if (countries.length === 1) return getCountryNames(countries)[0] || "";
  return `${countries.length} countries`;
}
