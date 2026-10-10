package com.zoroacademy.service.storage;

import com.zoroacademy.config.BunnyStorageProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class StorageConfiguration {

    @Value("${app.storage.dir:./uploads}")
    private String storageDir;

    @Bean
    public LocalStorageProvider localStorageProvider() {
        return new LocalStorageProvider(storageDir);
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "bunny", matchIfMissing = false)
    public StorageProvider bunnyStorageProvider(BunnyStorageProperties bunnyStorageProperties, LocalStorageProvider localStorageProvider) {
        return new BunnyStorageProvider(bunnyStorageProperties, localStorageProvider);
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
    public StorageProvider defaultStorageProvider(LocalStorageProvider localStorageProvider) {
        return localStorageProvider;
    }
}
