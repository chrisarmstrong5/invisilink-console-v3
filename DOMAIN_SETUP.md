# Custom Domain Setup Guide

This guide explains how to set up custom domains for your InvisiLink Console deployment.

## Why Custom Domains?

Using custom domains instead of third-party tracking domains provides:

1. **Better deliverability** - Your links won't be flagged by TikTok/Facebook
2. **Control** - You own the domain and can't get banned from a shared service
3. **Professionalism** - Clean, branded domains look more trustworthy
4. **Compliance** - Facebook requires direct tracking with custom domains

## Domain Types

You need **two types** of domains:

### 1. TikTok Tracking Domain (Redirect)
- **Purpose**: Replace `rgbad.ttrk.io` in RedTrack tracking URLs
- **Example**: `track-af1.com` or `metrics-xyz.net`
- **Quantity**: 1 domain (you can add more for rotation)
- **Platform**: TikTok only

### 2. Facebook Cloak Domains (Direct + Redirect)
- **Purpose**: Host your white pages for Facebook campaigns
- **Example**: `shopdeals-us.com`, `trending-offers.net`
- **Quantity**: 2-3 domains recommended (for rotation)
- **Platform**: Facebook only

---

## Part 1: TikTok Tracking Domain Setup

### Step 1: Purchase Domain

1. Go to **Namecheap**, **GoDaddy**, or **Porkbun**
2. Search for a cheap domain (`.com`, `.net`, `.co`, `.io`)
3. Keep it **generic** - avoid brand names
4. Examples:
   - `track-af1.com`
   - `metrics-xyz.net`
   - `analytics-hub.co`
5. Purchase for **1 year** ($10-15)

### Step 2: Point Domain to RedTrack

You need to configure this domain in **RedTrack** (not Vercel).

1. **Login to RedTrack Dashboard**
2. Go to **Settings → Tracking Domains**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `track-af1.com`)
5. RedTrack will show you **DNS records** to add

### Step 3: Configure DNS

1. **Login to your domain registrar** (Namecheap/GoDaddy/Porkbun)
2. Go to **DNS Management** for your domain
3. Add the **A Record** provided by RedTrack:
   ```
   Type: A
   Host: @
   Value: [IP from RedTrack]
   TTL: Automatic
   ```
4. Add the **CNAME Record** (if required):
   ```
   Type: CNAME
   Host: www
   Value: [value from RedTrack]
   TTL: Automatic
   ```

### Step 4: Enable SSL in RedTrack

1. Wait **5-10 minutes** for DNS to propagate
2. In RedTrack, click **"Enable SSL"** next to your domain
3. RedTrack will auto-provision an SSL certificate
4. Once SSL shows **"Active"**, your domain is ready

### Step 5: Update InvisiLink Config

1. Open `/lib/config.ts` in your InvisiLink Console
2. Find the `redtrack` section:
   ```typescript
   redtrack: {
     apiKey: process.env.NEXT_PUBLIC_REDTRACK_API_KEY || "",
     trackingDomain: "track-af1.com", // ← Change this
     // ...
   }
   ```
3. Replace `rgbad.ttrk.io` with your custom domain
4. Save and deploy

### Step 6: Test Your Tracking Domain

Generate a test link:
```
https://track-af1.com/click?campaign=123&sub1=test
```

If it redirects correctly, your tracking domain is working!

---

## Part 2: Facebook Cloak Domains Setup

### Step 1: Purchase 2-3 Domains

Facebook is **strict** about cloaking. To avoid bans:

1. **Buy 2-3 generic domains**:
   - `shopdeals-us.com`
   - `trending-offers.net`
   - `best-prices-hub.co`
2. Keep names **generic** - no brand mentions
3. Use different **registrars** if possible (spread risk)

### Step 2: Add Domains to Vercel

For each domain:

1. **Login to Vercel Dashboard**
2. Go to your **InvisiLink Console project**
3. Click **Settings → Domains**
4. Click **"Add Domain"**
5. Enter your domain (e.g., `shopdeals-us.com`)
6. Vercel will show you **DNS records**

### Step 3: Configure DNS at Your Registrar

1. **Login to domain registrar**
2. Go to **DNS Management**
3. Add **A Record**:
   ```
   Type: A
   Host: @
   Value: 76.76.21.21
   TTL: Automatic
   ```
4. Add **CNAME for www**:
   ```
   Type: CNAME
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
   ```

**Note**: Exact values shown in Vercel dashboard - use those!

### Step 4: Wait for SSL

1. **Wait 5-30 minutes** for DNS propagation
2. Vercel will **auto-provision SSL** (Let's Encrypt)
3. Check Vercel dashboard - domain should show **"Valid"**

### Step 5: Add Domains to InvisiLink Config

1. Open `/lib/config.ts`
2. Find the `facebook.domains` section:
   ```typescript
   facebook: {
     domains: [
       {
         id: "fb-cloak-1",
         name: "ShopDeals US",
         url: "https://shopdeals-us.com",
       },
       {
         id: "fb-cloak-2",
         name: "Trending Offers",
         url: "https://trending-offers.net",
       },
     ],
     defaultDomain: "fb-cloak-1",
     // ...
   }
   ```
3. Add all your Facebook domains
4. Save and **redeploy**

### Step 6: Test Facebook Domains

1. Go to **InvisiLink Console → Links**
2. Select **Platform: Facebook**
3. Generate a test link
4. The white page URL should use your custom domain:
   ```
   https://shopdeals-us.com/apple-111-abc123
   ```
5. Open the URL - should show your white page

---

## Part 3: Facebook Tracking Modes

InvisiLink supports **two tracking modes** for Facebook:

### Direct Tracking (Recommended for FB)

- **No redirect** - passes tracking params directly to offer page
- **FB-compliant** - follows Facebook's landing page policies
- **Setup**:
  1. Select **Platform: Facebook**
  2. Set **Tracking Mode: Direct**
  3. Add **Facebook Pixel ID** (optional)
  4. Generate link

**How it works**:
```
User clicks ad → shopdeals-us.com/abc123 → Offer page (with ?fbclid=... params)
```

### Redirect Tracking (Testing Only)

- **Uses redirect** - like TikTok cloak flow
- **Violates FB policies** - use only for testing
- **Setup**:
  1. Select **Platform: Facebook**
  2. Set **Tracking Mode: Redirect**
  3. Generate link

**How it works**:
```
User clicks ad → shopdeals-us.com/abc123 → RedTrack → Offer page
```

⚠️ **Warning**: Redirect mode may result in Facebook account bans. Use **Direct mode** for production campaigns.

---

## DNS Propagation Tips

- **Check DNS**: Use [dnschecker.org](https://dnschecker.org) to verify DNS changes
- **Clear cache**: Use incognito/private browsing when testing
- **Wait time**: Can take 5 minutes to 48 hours (usually ~10 minutes)
- **SSL issues**: If SSL fails, wait 30 mins and try again in Vercel/RedTrack

---

## Domain Rotation Strategy

### TikTok
- Use **1 tracking domain** initially
- Add more if you scale to 100K+ clicks/day
- Rotate when domain gets flagged (you'll see drop in conversions)

### Facebook
- Use **2-3 cloak domains** from day 1
- **Rotate weekly** or per campaign
- Monitor for bans - if domain gets blocked, replace immediately
- Keep 1-2 backup domains ready

---

## Troubleshooting

### "Domain Not Found" Error
- DNS not propagated yet - wait 30 minutes
- Check DNS records with `dig yourdomain.com` or dnschecker.org
- Verify A record points to correct IP

### SSL Certificate Failed
- Wait 30 minutes after DNS changes
- In Vercel: Remove domain, wait 5 mins, re-add
- In RedTrack: Click "Regenerate SSL"

### Link Not Redirecting
- **TikTok domain**: Check RedTrack campaign settings
- **Facebook domain**: Verify white page was deployed to Vercel
- Test URL in incognito mode
- Check Vercel deployment logs

### Facebook Account Banned
- You used **redirect mode** - switch to **direct mode**
- Domain was flagged - rotate to a new domain
- Landing page violates FB policy - check white page content

---

## Cost Summary

| Item | Quantity | Cost/Year |
|------|----------|-----------|
| TikTok Tracking Domain | 1-2 | $10-30 |
| Facebook Cloak Domains | 2-3 | $30-50 |
| **Total** | **3-5 domains** | **$40-80/year** |

---

## Quick Checklist

### TikTok Tracking Domain
- [ ] Purchase domain
- [ ] Add to RedTrack tracking domains
- [ ] Configure DNS (A + CNAME)
- [ ] Enable SSL in RedTrack
- [ ] Update InvisiLink config
- [ ] Test tracking link

### Facebook Cloak Domains (per domain)
- [ ] Purchase domain
- [ ] Add to Vercel project
- [ ] Configure DNS (A + CNAME)
- [ ] Wait for SSL (auto)
- [ ] Add to InvisiLink config
- [ ] Generate test link
- [ ] Verify white page loads

---

## Need Help?

- **DNS issues**: Check [dnschecker.org](https://dnschecker.org)
- **Vercel SSL**: [Vercel Docs - Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- **RedTrack domains**: [RedTrack Support](https://redtrack.io/support)

---

**Last Updated**: Phase 1 Deployment (2025)
