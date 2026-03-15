/**
 * 👻 SpectreData - Advanced Stealth Extraction Engine
 * --------------------------------------------------
 * Developed by: YourName
 * Version: 1.1 (Stable)
 * Features: Ghost Mode, JSON Fallback, Multi-Video Hunter
 * --------------------------------------------------
 * Unauthorized copying or distribution of this code is strictly prohibited.
 */
package com.scraper.backend;
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitUntilState;
import org.springframework.stereotype.Service;

import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ScraperService {

    // ==========================================
    // 1. ORIGINAL SINGLE PRODUCT SCRAPER
    // ==========================================
    public ProductResponse scrape(String urlToScrape) {
        ProductResponse response = new ProductResponse();
        response.targetUrl = urlToScrape;
        response.imageUrls = new ArrayList<>();
        response.videoUrls = new ArrayList<>();

        try (Playwright playwright = Playwright.create()) {
            BrowserContext context = playwright.chromium().launchPersistentContext(
                    Paths.get("playwright-profile"),
                    new BrowserType.LaunchPersistentContextOptions()
                            .setHeadless(true)
                            .setArgs(List.of("--disable-blink-features=AutomationControlled"))
                            .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
            );

            Page page = context.pages().get(0);
            page.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");

            page.navigate(urlToScrape, new Page.NavigateOptions().setWaitUntil(WaitUntilState.DOMCONTENTLOADED).setTimeout(90000));
            page.waitForTimeout(5000);

            page.onDialog(dialog -> dialog.accept());
            String[] popupSelectors = { "button:has-text('Accept All')", "button:has-text('Accepter')", "button:has-text('Confirm')", ".cookie-accept", ".close" };
            for (String selector : popupSelectors) {
                try {
                    Locator btn = page.locator(selector).first();
                    if (btn.isVisible()) { btn.click(new Locator.ClickOptions().setTimeout(1000)); page.waitForTimeout(500); }
                } catch (Exception e) { }
            }

            try { response.title = page.locator("h1, .product-details__title, .product__name, .productView-title").first().innerText().trim(); } catch (Exception e) { response.title = "Title not found"; }

            response.price = null;
            try {
                String priceSelectors = ".price-box .price, .price--withoutTax, [itemprop='price'], .acl-price__value, .price, .product-price";
                Locator priceLocator = page.locator(priceSelectors).filter(new Locator.FilterOptions().setHasText(Pattern.compile("\\d")));
                if (priceLocator.count() > 0) {
                    Matcher matcher = Pattern.compile("(\\d+[.,\\s]*\\d*\\s*\\p{Sc})|(\\p{Sc}\\s*\\d+[.,\\s]*\\d*)").matcher(priceLocator.first().innerText().trim());
                    response.price = matcher.find() ? matcher.group().trim() : priceLocator.first().innerText().trim();
                }
            } catch (Exception e) { }

            if (response.price == null || response.price.isEmpty()) {
                try {
                    String scriptContent = (String) page.evaluate("() => { return Array.from(document.querySelectorAll('script')).map(s => s.innerText).join(' '); }");
                    Matcher jsonMatcher = Pattern.compile("\"price\"\\s*:\\s*\"?(\\d+[.,]?\\d*)\"?").matcher(scriptContent);
                    response.price = jsonMatcher.find() ? jsonMatcher.group(1) : "Price not found";
                } catch (Exception e) { response.price = "Price not found"; }
            }

            try {
                try {
                    Locator metaImage = page.locator("meta[property='og:image']");
                    if (metaImage.count() > 0) response.imageUrls.add(metaImage.first().getAttribute("content").trim());
                } catch (Exception e) {}

                String variantContainer = "[class*='w-full border-0 m-0 md:w-1/2 box-border'] img";
                List<Locator> targetElements = page.locator(variantContainer).all();

                if (targetElements.isEmpty()) {
                    targetElements = page.locator(".productView-images img, .product-image-photo, img.acl-image__image, .gallery img, img[class*='img'], picture img").all();
                }

                for (Locator img : targetElements) {
                    String src = img.getAttribute("src");
                    if (src == null || src.startsWith("data:image")) {
                        src = img.getAttribute("data-src");
                        if (src == null) src = img.getAttribute("data-lazy");
                        if (src == null) src = img.getAttribute("srcset");
                        if (src != null && src.contains(" ")) src = src.split(" ")[0];
                    }
                    if (src != null && !src.isEmpty() && !response.imageUrls.contains(src.trim()) && src.startsWith("http")) {
                        response.imageUrls.add(src.trim());
                    }
                    if (response.imageUrls.size() >= 10) break;
                }
            } catch (Exception e) { }

            try {
                response.brand = (String) page.evaluate("() => { const scripts = document.querySelectorAll('script[type=\"application/ld+json\"]'); for (let script of scripts) { try { const data = JSON.parse(script.innerText); if (data.brand && data.brand.name) return data.brand.name; if (Array.isArray(data)) { for (let item of data) { if (item.brand && item.brand.name) return item.brand.name; } } } catch(e) {} } return null; }");
                if (response.brand == null) response.brand = page.locator("[itemprop='brand'], .brand").first().innerText().trim();
            } catch (Exception e) { response.brand = null; }

            extractVideos(page, response);
            context.close();

        } catch (Exception e) { response.error = "Error: " + e.getMessage(); }
        return response;
    }

    // ==========================================
    // 2. THE NEW HIGH-SPEED BULK VIDEO ENGINE
    // ==========================================
    public List<ProductResponse> bulkVideoScrape(List<String> urlsToScrape) {
        List<ProductResponse> results = new ArrayList<>();

        try (Playwright playwright = Playwright.create()) {
            BrowserContext context = playwright.chromium().launchPersistentContext(
                    Paths.get("playwright-profile"),
                    new BrowserType.LaunchPersistentContextOptions()
                            .setHeadless(true)
                            .setArgs(List.of("--disable-blink-features=AutomationControlled"))
                            .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
            );

            for (String url : urlsToScrape) {
                if (url == null || url.trim().isEmpty()) continue;

                ProductResponse response = new ProductResponse();
                response.targetUrl = url.trim();
                response.videoUrls = new ArrayList<>();

                try {
                    Page page = context.newPage();
                    page.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");

                    page.navigate(response.targetUrl, new Page.NavigateOptions().setWaitUntil(WaitUntilState.DOMCONTENTLOADED).setTimeout(60000));
                    page.waitForTimeout(4000);

                    extractVideos(page, response);
                    page.close();
                } catch (Exception e) {
                    response.error = e.getMessage();
                }
                results.add(response);
            }
            context.close();
        } catch (Exception e) {
            System.out.println("Bulk Scrape Error: " + e.getMessage());
        }
        return results;
    }

    // ==========================================
    // 3. UPGRADED MULTI-VIDEO HUNTER LOGIC
    // ==========================================
    private void extractVideos(Page page, ProductResponse response) {
        try {
            // Step 1: Click multiple play buttons (instead of just the first one) to wake up sleeping videos
            try {
                List<Locator> playBtns = page.locator(".acl-video__play, button[title='Play'], .video-play-button, [aria-label*='Video'], .play-icon").all();
                for (int i = 0; i < Math.min(playBtns.size(), 3); i++) {
                    if (playBtns.get(i).isVisible()) {
                        playBtns.get(i).click(new Locator.ClickOptions().setTimeout(1000).setForce(true));
                        page.waitForTimeout(1000);
                    }
                }
            } catch (Exception e) { }

            // Temporary list to hold raw video data before we clean it
            List<String> rawVideos = new ArrayList<>();

            // Step 2: Search standard video elements, including hidden "data" attributes!
            List<Locator> videoTags = page.locator("video, video source, [data-video-url], [data-video]").all();
            for (Locator v : videoTags) {
                if (v.getAttribute("src") != null) rawVideos.add(v.getAttribute("src"));
                if (v.getAttribute("data-src") != null) rawVideos.add(v.getAttribute("data-src"));
                if (v.getAttribute("data-video-url") != null) rawVideos.add(v.getAttribute("data-video-url"));
                if (v.getAttribute("data-video") != null) rawVideos.add(v.getAttribute("data-video"));
            }

            // Step 3: Search iframes
            List<Locator> iframes = page.locator("iframe").all();
            for (Locator iframe : iframes) {
                String src = iframe.getAttribute("src");
                if (src == null) src = iframe.getAttribute("data-src");

                if (src != null && (src.contains("youtube") || src.contains("vimeo") || src.contains("video") || src.contains("scene7") || src.contains("player") || src.endsWith(".mp4"))) {
                    rawVideos.add(src);
                }
            }

            // Step 4: Search Meta tags
            List<Locator> metaVideos = page.locator("meta[property='og:video'], meta[property='og:video:url'], meta[itemprop='contentUrl']").all();
            for (Locator meta : metaVideos) {
                if (meta.getAttribute("content") != null) rawVideos.add(meta.getAttribute("content"));
            }

            // --- STEP 5: THE HTTPS FIXER & LINK CLEANER ---
            for (String src : rawVideos) {
                // Ignore junk data
                if (src == null || src.trim().isEmpty() || src.startsWith("blob:") || src.startsWith("data:image")) {
                    continue;
                }

                String cleanUrl = src.trim();

                // 🛑 THE HTTPS FIX: If it starts with "//", stick "https:" on the front!
                if (cleanUrl.startsWith("//")) {
                    cleanUrl = "https:" + cleanUrl;
                }

                // The Embed to Watch format replacer
                if (cleanUrl.contains("/embed/")) {
                    cleanUrl = cleanUrl.replace("/embed/", "/watch/");
                } else if (cleanUrl.contains("youtube.com") && cleanUrl.contains("embed")) {
                    cleanUrl = cleanUrl.replace("embed", "watch");
                }

                // Add to final list (only if we haven't already grabbed this exact link)
                if (!response.videoUrls.contains(cleanUrl)) {
                    response.videoUrls.add(cleanUrl);
                }
            }

        } catch (Exception e) { }
    }
}