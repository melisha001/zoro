package com.zoroacademy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.storage.bunny")
public class BunnyStorageProperties {
    private String host = "storage.bunnycdn.com";
    private String zone;
    private String password;
    private String cdnHost;

    public String getHost() {
        return (host != null && !host.isBlank()) ? host : "storage.bunnycdn.com";
    }

    public void setHost(String host) {
        this.host = host;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getCdnHost() {
        return cdnHost;
    }

    public void setCdnHost(String cdnHost) {
        this.cdnHost = cdnHost;
    }
}
