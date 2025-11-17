// api/tiktok-playwright.js
// Playwright-backed TikTok extractor + screenshot endpoint.
// Returns JSON by default: { followers: number | null, source: 'dom'|'regex'|null }
// If ?screenshot=1 is present returns image/png (screenshot of the follower area if found)

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const CACHE_TTL = 30 * 1000; // 30s
const cache = new Map();

function toNumberIfLooksLike(str) {
  if (!str) return null;
  if (typeof str === 'number') return Number.isFinite(str) ? str : null;
  const cleaned = String(str).replace(/[^\d.,kKmM]/g, '').trim();
  if (!cleaned) return null;
  const m = cleaned.match(/^([\d.,]+)\s*[mM]$/);
  if (m) return Math.round(Number(m[1].replace(/,/g, '')) * 1_000_000);
  const k = cleaned.match(/^([\d.,]+)\s*[kK]$/);
  if (k) return Math.round(Number(k[1].replace(/,/g, '')) * 1_000);
  const digits = cleaned.replace(/[^\d]/g, '');
  if (/^\d+$/.test(digits)) return Number(digits);
  return null;
}

/** Extract follower number heuristically from page DOM text */
async function extractFollowersFromPage(page) {
  // Try to find elements that contain the word 'followers' and numeric text
  const candidates = await page.$$eval('*', (els) =>
    els
      .filter((el) => {
        const t = el.innerText || '';
        return /\bfollowers?\b/i.test(t);
      })
      .map((el) => ({ text: el.innerText?.trim(), tag: el.tagName }))
  );

  // prefer first candidate that includes digits
  for (const c of candidates) {
    const m = c.text && c.text.match(/([\d.,]+\s*[kKmM]?)/);
    if (m && m[1]) {
      return { n: m[1], source: 'dom' };
    }
    // if full text has only digits somewhere
    const digits = (c.text || '').match(/([0-9]{2,}[0-9,\.kKmM]*)/);
    if (digits && digits[1]) return { n: digits[1], source: 'dom' };
  }

  // fallback: search page HTML for JSON fields like "followerCount":12345
  const html = await page.content();
  const jsonMatch = html.match(/"followerCount"\s*:\s*([0-9]+)/i) || html.match(/"follower_count"\s*:\s*([0-9]+)/i);
  if (jsonMatch) return { n: jsonMatch[1], source: 'regex' };

  // try og:description meta
  const ogMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch && ogMatch[1]) {
    const m = ogMatch[1].match(/([\d.,]+\s*[kKmM]?)[^\d]*followers?/i);
    if (m) return { n: m[1], source: 'og' };
  }

  return { n: null, source: null };
}

export default async function handler(req, res) {
  // CORS for dev ease
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const username = ((req.query.user || req.query.username) + '').replace(/^@/, '').trim() || 'boy.throb';
    const wantScreenshot = (req.query.screenshot === '1' || req.query.screenshot === 'true');
    const cacheKey = `${username}:${wantScreenshot ? 'img' : 'json'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      if (wantScreenshot) {
        res.setHeader('Content-Type', 'image/png');
        return res.status(200).send(Buffer.from(cached.value, 'base64'));
      } else {
        return res.status(200).json(cached.value);
      }
    }

    // Launch Chromium
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      locale: 'en-US',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    const url = `https://www.tiktok.com/@${encodeURIComponent(username)}`;
    // navigate and wait for network to be mostly idle
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

    // give JS small time to render
    await page.waitForTimeout(800);

    // try to extract follower number
    const extracted = await extractFollowersFromPage(page);
    let followers = null;
    if (extracted.n) {
      followers = toNumberIfLooksLike(extracted.n);
    }

    // If screenshot requested: try to screenshot the element that contains 'followers' text
    if (wantScreenshot) {
      // try to find element that has 'followers' in its innerText
      let buf = null;
      try {
        const elHandle = await page.$eval('*', () => null).catch(() => null);
        // we can't rely on a single known selector, so search for an element
        const target = await page.$(`xpath=//*[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'followers')]`)
          .catch(() => null);

        if (target) {
          // screenshot the element
          buf = await target.screenshot({ type: 'png' });
        } else {
          // fallback: screenshot a crop of top area (where header/stats usually are)
          const viewport = page.viewportSize() || { width: 1200, height: 800 };
          const clip = {
            x: 0,
            y: 60,
            width: Math.min(viewport.width, 1000),
            height: Math.min(viewport.height, 420),
          };
          buf = await page.screenshot({ type: 'png', clip }).catch(async () => {
            // fallback to full page
            return await page.screenshot({ type: 'png', fullPage: false });
          });
        }
      } catch (sErr) {
        // final fallback: full page screenshot
        try {
          buf = await page.screenshot({ type: 'png', fullPage: false });
        } catch (e) {
          buf = null;
        }
      } finally {
        await browser.close();
      }

      if (!buf) {
        // save null response
        cache.set(cacheKey, { value: null, ts: Date.now() });
        return res.status(200).json({ error: 'screenshot_failed' });
      }

      const b64 = buf.toString('base64');
      cache.set(cacheKey, { value: b64, ts: Date.now() });

      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(Buffer.from(b64, 'base64'));
    }

    // not screenshot mode: return JSON
    await browser.close();

    const payload = { followers: followers === null ? null : Number(followers), source: extracted.source || null };
    cache.set(cacheKey, { value: payload, ts: Date.now() });
    return res.status(200).json(payload);
  } catch (err) {
    console.error('tiktok-playwright error', err);
    return res.status(500).json({ error: String(err) });
  }
}
