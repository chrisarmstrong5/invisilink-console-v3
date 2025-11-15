/**
 * Bot Detection Script Builder
 *
 * Generates JavaScript code that checks if traffic is bot/desktop and redirects accordingly.
 * Ported from v2's head-snippet.js with two filtering modes:
 * - params-only: TikTok optimized (checks ppc parameter only)
 * - advanced: Checks both ppc parameter AND user agent patterns
 */

export interface BotDetectionOptions {
  primaryUrl: string;
  fallbackUrl?: string;
  placementParam?: string;
  botPlacementValue?: string;
  delayMs?: number;
  // V2 features
  disableCloaking?: boolean;
  geoTargeting?: {
    enabled: boolean;
    targetCountries: string[];
  };
  tiktok?: {
    pixelEnabled?: boolean;
    pixelId?: string;
    browserRedirectEnabled?: boolean;
    strictBotDetectionEnabled?: boolean;
  };
}

/**
 * Build bot detection script with ADVANCED filtering (params + user agent)
 *
 * Checks:
 * 1. If ppc=__PLACEMENT__ (unfilled TikTok macro)
 * 2. User agent matches bot patterns
 * 3. If NOT bot AND mobile → redirect to RedTrack
 * 4. Otherwise → stay on white page
 */
export function buildHeadScript(options: BotDetectionOptions): string {
  if (!options || !options.primaryUrl) {
    throw new Error("buildHeadScript requires a primaryUrl");
  }

  // Handle disable cloaking (instant redirect)
  if (options.disableCloaking) {
    return buildDisableCloakingScript(options.primaryUrl);
  }

  const {
    primaryUrl,
    fallbackUrl = primaryUrl,
    placementParam = "ppc",
    botPlacementValue = "__PLACEMENT__",
    delayMs = 50,
    tiktok,
  } = options;

  // Build bot pattern with optional TikTok strict detection
  const botPattern = buildBotPattern(tiktok?.strictBotDetectionEnabled || false);

  const scriptBody = `(function() {
    try {
        const params = new URLSearchParams(window.location.search);
        const placementValue = params.get(${JSON.stringify(placementParam)});

        const isMobileDevice = () => {
            const ua = navigator.userAgent;
            const matches = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|Mobile|Tablet/i;
            return matches.test(ua) || (window.innerWidth <= 768 && window.innerHeight <= 1024);
        };

        const isBotUserAgent = () => {
            const ua = navigator.userAgent.toLowerCase();
            const botPatterns = ${botPattern};
            return botPatterns.test(ua);
        };

        const isBot = placementValue === ${JSON.stringify(botPlacementValue)} || isBotUserAgent();

        if (!isBot && isMobileDevice()) {
            window.location.replace(${JSON.stringify(primaryUrl)});
            return;
        }

        window.setTimeout(() => {
            if (!isBot && isMobileDevice()) {
                window.top.location = ${JSON.stringify(fallbackUrl)};
            }
        }, ${delayMs});
    } catch (error) {
        console.error(error);
    }
})();`;

  return `<script>
${scriptBody}
</script>`;
}

/**
 * Build bot detection script with PARAMS-ONLY filtering (TikTok optimized)
 *
 * Only checks:
 * 1. If ppc=__PLACEMENT__ (unfilled TikTok macro)
 * 2. If NOT bot AND mobile → redirect to RedTrack
 *
 * NO user agent detection (may reduce TikTok drop-off)
 */
export function buildHeadScript_ParamsOnly(options: BotDetectionOptions): string {
  if (!options || !options.primaryUrl) {
    throw new Error("buildHeadScript_ParamsOnly requires a primaryUrl");
  }

  // Handle disable cloaking (instant redirect)
  if (options.disableCloaking) {
    return buildDisableCloakingScript(options.primaryUrl);
  }

  const {
    primaryUrl,
    fallbackUrl = primaryUrl,
    placementParam = "ppc",
    botPlacementValue = "__PLACEMENT__",
    delayMs = 50,
  } = options;

  const scriptBody = `(function() {
    try {
        const params = new URLSearchParams(window.location.search);
        const placementValue = params.get(${JSON.stringify(placementParam)});

        const isMobileDevice = () => {
            const ua = navigator.userAgent;
            const matches = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|Mobile|Tablet/i;
            return matches.test(ua) || (window.innerWidth <= 768 && window.innerHeight <= 1024);
        };

        // PARAMS-ONLY: Only check placement parameter, NO user agent detection
        const isBot = placementValue === ${JSON.stringify(botPlacementValue)};

        if (!isBot && isMobileDevice()) {
            window.location.replace(${JSON.stringify(primaryUrl)});
            return;
        }

        window.setTimeout(() => {
            if (!isBot && isMobileDevice()) {
                window.top.location = ${JSON.stringify(fallbackUrl)};
            }
        }, ${delayMs});
    } catch (error) {
        console.error(error);
    }
})();`;

  return `<script>
${scriptBody}
</script>`;
}

/**
 * Inject bot detection script into white page HTML
 *
 * Replaces {{HEAD_SCRIPT}} placeholder or inserts before </head>
 */
export function injectHeadScript(html: string, scriptTag: string): string {
  // First try to replace {{HEAD_SCRIPT}} placeholder (used in templates)
  if (html.includes("{{HEAD_SCRIPT}}")) {
    return html.replace("{{HEAD_SCRIPT}}", scriptTag);
  }

  // Fallback: inject before </head> tag
  if (!html.includes("</head>")) {
    return scriptTag + html;
  }

  return html.replace("</head>", `${scriptTag}\n</head>`);
}

/**
 * Build disable cloaking script (instant redirect, no filtering)
 *
 * Used when user wants to bypass all bot detection
 */
export function buildDisableCloakingScript(targetUrl: string): string {
  const scriptBody = `(function() {
    try {
        window.location.replace(${JSON.stringify(targetUrl)});
    } catch (error) {
        console.error(error);
        window.top.location = ${JSON.stringify(targetUrl)};
    }
})();`;

  return `<script>
${scriptBody}
</script>`;
}

/**
 * Build bot pattern regex with optional TikTok strict detection
 */
export function buildBotPattern(strictTikTokDetection: boolean): string {
  const basePattern =
    "/bot|crawler|spider|google|facebook|headless|phantomjs|selenium|webdriver|scraper|wget|curl|prerender|preview/i";

  if (strictTikTokDetection) {
    // Add TikTok-specific patterns
    return "/bot|crawler|spider|google|facebook|headless|phantomjs|selenium|webdriver|scraper|wget|curl|bytedance|tiktok|musically|prerender|preview/i";
  }

  return basePattern;
}

/**
 * Build complete head script with all features combined
 *
 * Combines:
 * - Bot detection (params-only or advanced)
 * - Geo-targeting (if enabled)
 * - TikTok Pixel (if enabled)
 * - TikTok Browser Redirect (if enabled)
 * - Disable cloaking (if enabled)
 */
export function buildCompleteHeadScript(options: BotDetectionOptions & {
  filterType?: "params-only" | "advanced";
}): string {
  const scripts: string[] = [];

  // 1. Add TikTok Pixel if enabled
  if (options.tiktok?.pixelEnabled && options.tiktok.pixelId) {
    const tiktokPixelScript = buildTikTokPixelScript(options.tiktok.pixelId);
    if (tiktokPixelScript) {
      scripts.push(tiktokPixelScript);
    }
  }

  // 2. Add TikTok Browser Redirect if enabled
  if (options.tiktok?.browserRedirectEnabled) {
    const browserRedirectScript = buildTikTokBrowserRedirectScript(
      options.primaryUrl
    );
    if (browserRedirectScript) {
      scripts.push(browserRedirectScript);
    }
  }

  // 3. Add bot detection script (or disable cloaking)
  const filterType = options.filterType || "advanced";
  const botDetectionScript =
    filterType === "params-only"
      ? buildHeadScript_ParamsOnly(options)
      : buildHeadScript(options);

  scripts.push(botDetectionScript);

  return scripts.join("\n");
}

/**
 * Build TikTok Pixel script (helper)
 */
function buildTikTokPixelScript(pixelId: string): string {
  const scriptBody = `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};

  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');

// Track ClickButton events on all clicks
document.addEventListener('click', function() {
  if (typeof ttq !== 'undefined') {
    ttq.track('ClickButton');
  }
}, true);`;

  return `<script>
${scriptBody}
</script>`;
}

/**
 * Build TikTok Browser Redirect script (helper)
 */
function buildTikTokBrowserRedirectScript(targetUrl: string): string {
  const scriptBody = `(function() {
    try {
        const ua = navigator.userAgent.toLowerCase();
        const isTikTokWebview = /tiktok|musical\\.ly|bytedance/i.test(ua);

        if (isTikTokWebview) {
            const currentUrl = encodeURIComponent(window.location.href);
            const intentUrl = 'intent://' + currentUrl.replace(/^https?:\\/\\//, '') + '#Intent;scheme=https;end';

            if (/android/i.test(ua)) {
                window.location.href = intentUrl;
            } else {
                window.location.href = ${JSON.stringify(targetUrl)};
            }
        }
    } catch (error) {
        console.error('TikTok browser redirect error:', error);
    }
})();`;

  return `<script>
${scriptBody}
</script>`;
}
