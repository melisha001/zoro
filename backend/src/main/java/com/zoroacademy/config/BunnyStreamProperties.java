package com.zoroacademy.config;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "bunny.stream")
public class BunnyStreamProperties {
    private String libraryId;
    private String apiKey;
    private String cdnHost;
    private String tokenAuthKey;
    private long tokenExpirationSeconds = 7200;
    private String webhookSecret;

    public BunnyStreamProperties() {}

    @PostConstruct
    public void validate() {
        if (libraryId == null || libraryId.isBlank()) {
            throw new IllegalStateException("FATAL: 'bunny.stream.library-id' (BUNNY_LIBRARY_ID) configuration property is required.");
        }
        if (cdnHost == null || cdnHost.isBlank()) {
            throw new IllegalStateException("FATAL: 'bunny.stream.cdn-host' (BUNNY_CDN_HOST) configuration property is required.");
        }
    }

    public String getLibraryId() {
        return libraryId;
    }

    public void setLibraryId(String libraryId) {
        this.libraryId = libraryId;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getCdnHost() {
        return cdnHost;
    }

    public void setCdnHost(String cdnHost) {
        this.cdnHost = cdnHost;
    }

    public String getTokenAuthKey() {
        return tokenAuthKey;
    }

    public void setTokenAuthKey(String tokenAuthKey) {
        this.tokenAuthKey = tokenAuthKey;
    }

    public long getTokenExpirationSeconds() {
        return tokenExpirationSeconds;
    }

    public void setTokenExpirationSeconds(long tokenExpirationSeconds) {
        this.tokenExpirationSeconds = tokenExpirationSeconds;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }
}
