package com.zoroacademy;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FileStorageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "admin@zoro.com", roles = {"ADMIN"})
    public void testPublicFileUploadAndRetrieveUnauthenticated() throws Exception {
        // PNG header magic bytes
        byte[] pngBytes = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test_thumbnail.png",
                "image/png",
                pngBytes
        );

        String responseStr = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .param("category", "thumbnail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").exists())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<?, ?> data = (Map<?, ?>) responseMap.get("data");
        String fileUrl = (String) data.get("url");
        String fileId = (String) data.get("id");

        // Reload via GET without authentication (should succeed because thumbnail is public)
        mockMvc.perform(get(fileUrl))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"));
    }

    @Test
    @WithMockUser(username = "std-1", roles = {"STUDENT"})
    public void testPrivateFileUpload_UnauthenticatedGetReturns401() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 test document content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "private_submission.pdf",
                "application/pdf",
                pdfBytes
        );

        String responseStr = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .param("category", "submission"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<?, ?> data = (Map<?, ?>) responseMap.get("data");
        String fileUrl = (String) data.get("url");

        // Unauthenticated GET on private file must return 401 Unauthorized
        mockMvc.perform(get(fileUrl))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testPrivateFileUpload_OtherStudentGetReturns403() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 private assignment content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "my_private_notes.pdf",
                "application/pdf",
                pdfBytes
        );

        com.zoroacademy.entity.User ownerUser = new com.zoroacademy.entity.User();
        ownerUser.setId("owner-student-1");
        ownerUser.setEmail("owner@student.com");
        ownerUser.setName("Owner Student");
        ownerUser.setRole("STUDENT");
        ownerUser.setPassword("pass123456");
        com.zoroacademy.security.UserPrincipal ownerPrincipal = com.zoroacademy.security.UserPrincipal.create(ownerUser);

        String responseStr = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .param("category", "submission")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerPrincipal)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<?, ?> data = (Map<?, ?>) responseMap.get("data");
        String fileUrl = (String) data.get("url");

        // Other non-owner student trying to access private submission file must return 403 Forbidden
        com.zoroacademy.entity.User otherUser = new com.zoroacademy.entity.User();
        otherUser.setId("other-student-999");
        otherUser.setEmail("other@student.com");
        otherUser.setName("Other Student");
        otherUser.setRole("STUDENT");
        otherUser.setPassword("pass123456");
        com.zoroacademy.security.UserPrincipal otherPrincipal = com.zoroacademy.security.UserPrincipal.create(otherUser);

        mockMvc.perform(get(fileUrl).with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(otherPrincipal)))
                .andExpect(status().isForbidden());
    }
}
