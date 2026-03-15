package com.scraper.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ScraperController {

    @Autowired
    private ScraperService scraperService;

    // The original Single Product endpoint
    @GetMapping("/scrape")
    public ProductResponse scrape(@RequestParam String url) {
        return scraperService.scrape(url);
    }

    // THE NEW BULK VIDEO ENDPOINT
    @PostMapping("/bulk-video")
    public List<ProductResponse> bulkVideo(@RequestBody List<String> urls) {
        return scraperService.bulkVideoScrape(urls);
    }
}