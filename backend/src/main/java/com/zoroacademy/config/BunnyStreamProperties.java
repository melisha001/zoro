package com.zoroacademy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "bunny.stream")
public class BunnyStreamProperties {
    private String libraryId = "770045";
    private String apiKey = "0726be56-9703-46cd-a987ac2f79f2-558e-4b2c4";
    private String cdnHost = "vz-251d06e3-32f.b-cdn.net";
    private String tokenAuthKey = "0726be56-9703-46cd-a987ac2f79f2-558e-4b2c4";
    private long tokenExpirationSeconds = 7200;

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
}
