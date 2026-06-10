/**
 * tests/visual/visual-regression.spec.ts
 *
 * Visual regression tests — compare screenshots against stored baselines.
 * Run `npm run baseline` to capture new baselines after intentional design changes.
 *
 * Tag: @visual
 */

import { test, expect } from '@fixtures/site.fixture';
import { dismissCookieBanner } from '@utils/visual-helper';

const SCREENSHOT_OPTIONS = {
  maxDiffPixels: 500,
  animations: 'disabled',
  caret: 'hide',
  fullPage: true,
} as const;

// Pages captured for visual regression
const VISUAL_PAGES = [
  { name: 'homepage', path: '' },
  { name: 'features', path: '/features/' },
  { name: 'pricing', path: '/pricing/' },
  { name: 'integrations', path: '/integrations/' },
  { name: 'contact', path: '/contact' },
] as const;

const VIEWPORTS = [
  { label: 'desktop', width: 1280, height: 720 },
  { label: 'mobile', width: 390, height: 844 },
  { label: 'tablet', width: 768, height: 1024 },
] as const;

test.describe('Visual Regression @visual', () => {
  test.beforeEach(async ({ siteConfig }) => {
    if (siteConfig.skipVisual) {
      test.skip(true, `Visual regression skipped for "${siteConfig.name}" (skipVisual: true)`);
    }
  });

  for (const vp of VIEWPORTS) {
    for (const pg of VISUAL_PAGES) {
      test(`${pg.name} visual regression - ${vp.label} @visual`, async ({ page, siteConfig }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Freeze animations BEFORE navigation so they never start looping.
        // Three sources of dynamic content on marketing sites:
        //   1. requestAnimationFrame loops (typewriter, counters)
        //   2. Fast setInterval timers (carousels, tickers)
        //   3. IntersectionObserver scroll-reveals (fade/slide-in on scroll)
        // We patch all three in addInitScript so the freeze is in place from
        // the very first script execution on the page.
        await page.addInitScript(`
          (function () {
            // 1. rAF — block all animation frames so JS-driven loops never start
            window.requestAnimationFrame = function () { return 0; };
            window.cancelAnimationFrame = function () {};

            // 2. setInterval / setTimeout — track all timers and cancel them all
            //    after 3 s so carousel / typewriter chains are killed regardless of delay
            var _origSI = window.setInterval.bind(window);
            var _origST = window.setTimeout.bind(window);
            var _timers = [];
            window.setInterval = function () {
              var id = _origSI.apply(window, arguments);
              _timers.push(id);
              return id;
            };
            window.setTimeout = function () {
              var id = _origST.apply(window, arguments);
              _timers.push(id);
              return id;
            };
            _origSI(function () {
              _timers.forEach(function (id) {
                clearTimeout(id);
                clearInterval(id);
              });
            }, 3000);

            // 3. IntersectionObserver — immediately reveal every observed element
            window.IntersectionObserver = function (callback) {
              return {
                observe: function (target) {
                  try {
                    var rect = target.getBoundingClientRect();
                    callback([{
                      isIntersecting: true, intersectionRatio: 1,
                      target: target, time: 0,
                      boundingClientRect: rect, intersectionRect: rect, rootBounds: null
                    }], this);
                  } catch (e) {}
                },
                unobserve: function () {},
                disconnect: function () {}
              };
            };
            window.IntersectionObserver.prototype = {};
          })();
        `);

        const url = siteConfig.url.replace(/\/$/, '') + pg.path;
        await page.goto(url, { waitUntil: 'networkidle' });

        await dismissCookieBanner(page);

        // Apply inline !important animation freezes to every element.
        // Inline styles beat ALL selector-based CSS regardless of specificity,
        // even if the site uses !important on class selectors.
        await page.evaluate(() => {
          // Freeze every DOM element via inline !important (highest cascade priority)
          document.querySelectorAll<HTMLElement>('*').forEach(el => {
            el.style.setProperty('animation-play-state', 'paused', 'important');
            el.style.setProperty('animation-duration', '0.001s', 'important');
            el.style.setProperty('animation-delay', '0s', 'important');
            el.style.setProperty('transition-duration', '0s', 'important');
            el.style.setProperty('transition-delay', '0s', 'important');
          });

          // Pause via Web Animations API
          document.getAnimations().forEach(a => { try { a.pause(); } catch (_) {} });

          // Kill rAF in the page context (belt-and-suspenders over the initScript)
          window.requestAnimationFrame = () => 0;

          // Pause SVG SMIL animations
          document.querySelectorAll<SVGSVGElement & { pauseAnimations?: () => void }>('svg').forEach(svg => {
            if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
          });

          // Freeze animated GIFs by replacing their src with a transparent 1×1 GIF
          const BLANK_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          document.querySelectorAll<HTMLImageElement>('img').forEach(img => {
            const src = img.currentSrc || img.src || '';
            if (src.toLowerCase().includes('.gif')) img.src = BLANK_GIF;
          });

          // Pause any video elements
          document.querySelectorAll<HTMLVideoElement>('video').forEach(v => {
            v.pause();
            v.currentTime = 0;
          });
        });

        await expect(page).toHaveScreenshot(`${pg.name}-${vp.label}.png`, {
          ...SCREENSHOT_OPTIONS,
        });
      });
    }
  }
});
