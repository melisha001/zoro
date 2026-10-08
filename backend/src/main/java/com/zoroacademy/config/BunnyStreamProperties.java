package com.zoroacademy.config;

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
