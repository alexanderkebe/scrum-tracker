/* Run against a local dev server; PLAYWRIGHT_PATH can point to a bundled runtime. */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext();
  // Isolated test browser: preserve the user's first-three-visits demo counter.
  await context.addInitScript(() => localStorage.setItem('scrum-tracker:splash-v1:completed', '3'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
      const cards = [];
      await page.setViewportSize({ width, height });
      for (const route of ['login', 'register']) {
        await page.goto(`http://127.0.0.1:3000/${route}`, { waitUntil: 'networkidle' });
        await page.locator('main input').first().waitFor({ state: 'visible' });
        const geometry = await page.evaluate(() => {
          const card = document.querySelector('main > div');
          const rect = card.getBoundingClientRect();
          const board = document.querySelector('[class*="boardSketch"]');
          const features = document.querySelector('[class*="loginFeatureList"]');
          const a = board.getBoundingClientRect(), b = features.getBoundingClientRect();
          return {
            width: rect.width, height: rect.height, overflow: document.documentElement.scrollWidth > innerWidth,
            inputSize: parseFloat(getComputedStyle(document.querySelector('input')).fontSize),
            overlap: a.width > 0 && b.width > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top,
          };
        });
        assert.equal(geometry.overflow, false, `${route} overflows at ${width}x${height}`);
        assert.ok(geometry.height <= height, `${route} card exceeds viewport height`);
        assert.ok(geometry.inputSize >= 16, 'Form input text must remain readable');
        assert.equal(geometry.overlap, false, 'Board overlaps feature cards');
        cards.push(geometry.width);
        if (width === 1920 || width === 390) {
          await page.screenshot({ path: path.join(os.tmpdir(), `scrum-${route}-${width}.png`), fullPage: true });
        }
      }
      assert.equal(cards[0], cards[1], `Card widths differ at ${width}`);
      console.log(`PASS ${width}x${height}: equal card widths, contained height, readable inputs, no overlap`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:3000/login');
    await page.waitForFunction(() => [...document.querySelectorAll('aside video')].some(video => video.currentTime > 0 && !video.paused));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelectorAll('video').length === 0);
    assert.equal(await page.locator('[class*="boardSketch"]').evaluate(element => getComputedStyle(element).animationName), 'none');
    assert.deepEqual(errors, []);
    console.log('PASS animated logo playback, reduced-motion fallback, no runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
