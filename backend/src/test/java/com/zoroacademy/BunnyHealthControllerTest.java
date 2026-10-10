package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.config.BunnyStorageProperties;
import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.controller.BunnyHealthController;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BunnyHealthControllerTest {

    @Test
    void testHealthCheckReportsErrorsWhenMissingProperties() {
        BunnyStorageProperties storageProps = new BunnyStorageProperties();
        storageProps.setZone("");
        storageProps.setPassword("");

        BunnyStreamProperties streamProps = new BunnyStreamProperties();
        streamProps.setLibraryId("");
        streamProps.setApiKey("");

        BunnyHealthController controller = new BunnyHealthController(storageProps, streamProps);
        ApiResponse<Map<String, String>> response = controller.checkHealth();

        assertNotNull(response);
        assertTrue(response.isSuccess());
        Map<String, String> data = response.getData();
        assertNotNull(data);
        assertTrue(data.containsKey("storage"));
        assertTrue(data.containsKey("stream"));
        assertTrue(data.get("storage").contains("ERROR"));
        assertTrue(data.get("stream").contains("ERROR"));
    }

    @Test
    void testHealthCheckDoesNotExposeSecretsOnError() {
        BunnyStorageProperties storageProps = new BunnyStorageProperties();
        storageProps.setHost("invalid-unreachable-host-99999.bunnycdn.com");
        storageProps.setZone("my-zone");
        storageProps.setPassword("superSecretPassword123");

        BunnyStreamProperties streamProps = new BunnyStreamProperties();
        streamProps.setLibraryId("12345");
        streamProps.setApiKey("superSecretApiKey456");

        BunnyHealthController controller = new BunnyHealthController(storageProps, streamProps);
        ApiResponse<Map<String, String>> response = controller.checkHealth();

        Map<String, String> data = response.getData();
        assertFalse(data.get("storage").contains("superSecretPassword123"), "Storage secret should not be in error message");
        assertFalse(data.get("stream").contains("superSecretApiKey456"), "Stream secret should not be in error message");
    }
}
