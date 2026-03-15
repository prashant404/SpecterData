package com.scraper.backend;

import java.util.List;

/**
 * Data Transfer Object for SpectreData Engine
 * Author: YourName
 */
public class ProductResponse {
    public String engineVersion = "SpectreData v1.1-PRO"; // NEW: Digital signature in JSON
    public String targetUrl;
    public String title;
    public String brand;
    public String price;
    public List<String> imageUrls;
    public List<String> videoUrls;
    public String error;
}