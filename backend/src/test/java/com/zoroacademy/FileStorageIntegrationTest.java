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

import static org.junit.jupiter.api.Assertions.assertNotNull;
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

    @Test
    public void testPrivateFileLinkAndTokenAccess() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 private worksheet content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "worksheet.pdf",
                "application/pdf",
                pdfBytes
        );

        com.zoroacademy.entity.User trainerUser = new com.zoroacademy.entity.User();
        trainerUser.setId("trainer-user-1");
        trainerUser.setEmail("trainer1@zoro.com");
        trainerUser.setName("Trainer One");
        trainerUser.setRole("TRAINER");
        trainerUser.setPassword("pass123456");
        com.zoroacademy.security.UserPrincipal trainerPrincipal = com.zoroacademy.security.UserPrincipal.create(trainerUser);

        String uploadRes = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .param("category", "worksheet")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(trainerPrincipal)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> uploadMap = objectMapper.readValue(uploadRes, Map.class);
        Map<?, ?> uploadData = (Map<?, ?>) uploadMap.get("data");
        String fileId = (String) uploadData.get("id");

        // Request private link as trainer
        String linkRes = mockMvc.perform(get("/api/files/" + fileId + "/link")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(trainerPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").exists())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> linkMap = objectMapper.readValue(linkRes, Map.class);
        Map<?, ?> linkData = (Map<?, ?>) linkMap.get("data");
        String signedUrl = (String) linkData.get("url");
        assertNotNull(signedUrl);

        // Access via signed URL without authentication
        mockMvc.perform(get(signedUrl))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }

    @Test
    public void testStudentUploadWithStdPrefixedUuid_Success() throws Exception {
        String stdId = "std_" + java.util.UUID.randomUUID(); // > 36 chars (40 chars)
        com.zoroacademy.entity.User student = new com.zoroacademy.entity.User();
        student.setId(stdId);
        student.setEmail("std_prefixed@student.com");
        student.setName("Prefixed Student");
        student.setRole("STUDENT");
        student.setPassword("pass123456");
        com.zoroacademy.security.UserPrincipal studentPrincipal = com.zoroacademy.security.UserPrincipal.create(student);

        // 1. PDF
        byte[] pdfBytes = "%PDF-1.4 real student homework solution".getBytes();
        MockMultipartFile pdfFile = new MockMultipartFile("file", "homework_solution.pdf", "application/pdf", pdfBytes);
        mockMvc.perform(multipart("/api/files").file(pdfFile).param("category", "submission")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 2. DOCX (Zip magic: 0x50 0x4B 0x03 0x04)
        byte[] docxBytes = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
        MockMultipartFile docxFile = new MockMultipartFile("file", "essay.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes);
        mockMvc.perform(multipart("/api/files").file(docxFile).param("category", "submission")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. PNG (Magic: 0x89 'P' 'N' 'G')
        byte[] pngBytes = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0};
        MockMultipartFile pngFile = new MockMultipartFile("file", "drawing.png", "image/png", pngBytes);
        mockMvc.perform(multipart("/api/files").file(pngFile).param("category", "submission")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 4. JPG (Magic: 0xFF 0xD8 0xFF)
        byte[] jpgBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F', 0, 1, 1, 0, 0, 1};
        MockMultipartFile jpgFile = new MockMultipartFile("file", "photo.jpg", "image/jpeg", jpgBytes);
        mockMvc.perform(multipart("/api/files").file(jpgFile).param("category", "submission")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 5. MP3 (Magic: 'I' 'D' '3')
        byte[] mp3Bytes = new byte[]{'I', 'D', '3', 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0};
        MockMultipartFile mp3File = new MockMultipartFile("file", "voice_note.mp3", "audio/mpeg", mp3Bytes);
        mockMvc.perform(multipart("/api/files").file(mp3File).param("category", "submission")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 6. MP4 (Magic: offset 4 'f' 't' 'y' 'p')
        byte[] mp4Bytes = new byte[]{0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'm', 'p', '4', '2', 0, 0, 0, 0};
        MockMultipartFile mp4File = new MockMultipartFile("file", "speech_video.mp4", "video/mp4", mp4Bytes);
        mockMvc.perform(multipart("/api/files").file(mp4File).param("category", "submission")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

