package com.zoroacademy;

import com.zoroacademy.controller.FileController;
import com.zoroacademy.entity.StoredFile;
import com.zoroacademy.repository.StoredFileRepository;
import com.zoroacademy.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FileControllerStreamingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private StoredFileRepository storedFileRepository;

    @Test
    public void testResolveMimeTypeAudioWebm() {
        assertEquals("audio/webm", FileController.resolveMimeType("test.webm", "audio/webm"));
        assertEquals("audio/mpeg", FileController.resolveMimeType("test.mp3", null));
        assertEquals("audio/wav", FileController.resolveMimeType("test.wav", null));
        assertEquals("application/pdf", FileController.resolveMimeType("doc.pdf", null));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    public void testDownloadForbiddenForViewOnlyCategory() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "study.pdf", "application/pdf", "dummy pdf content".getBytes());
        StoredFile storedFile = fileStorageService.storeFile(file, "study-material", "admin-1");
        storedFile.setIsPublic(true);
        storedFileRepository.save(storedFile);

        mockMvc.perform(get("/api/files/" + storedFile.getId() + "/download"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    public void testRangeRequestReturns206PartialContent() throws Exception {
        byte[] audioData = new byte[2048];
        for (int i = 0; i < audioData.length; i++) {
            audioData[i] = (byte) (i % 128);
        }
        MockMultipartFile file = new MockMultipartFile(
                "file", "test-audio.mp3", "audio/mpeg", audioData);
        StoredFile storedFile = fileStorageService.storeFile(file, "question-media", "admin-1");
        storedFile.setIsPublic(true);
        storedFileRepository.save(storedFile);

        mockMvc.perform(get("/api/files/" + storedFile.getId())
                .header(HttpHeaders.RANGE, "bytes=0-100"))
                .andExpect(status().isPartialContent())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "audio/mpeg"))
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"));
    }
}
