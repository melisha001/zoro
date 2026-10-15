package com.zoroacademy;

import com.zoroacademy.dto.HeroImageOrderDto;
import com.zoroacademy.dto.HeroImageRequest;
import com.zoroacademy.entity.HeroImage;
import com.zoroacademy.repository.HeroImageRepository;
import com.zoroacademy.service.FileStorageService;
import com.zoroacademy.service.HeroImageService;
import com.zoroacademy.service.storage.StorageProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HeroImageServiceTest {

    @Mock
    private HeroImageRepository heroImageRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private StorageProvider storageProvider;

    private HeroImageService heroImageService;

    @BeforeEach
    void setUp() {
        heroImageService = new HeroImageService(heroImageRepository, fileStorageService, storageProvider);
    }

    @Test
    @DisplayName("createHeroImage calculates sortOrder when null and saves")
    void testCreateHeroImage() {
        when(heroImageRepository.findTopByOrderBySortOrderDesc()).thenReturn(Optional.empty());
        when(heroImageRepository.save(any(HeroImage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HeroImageRequest request = new HeroImageRequest("https://cdn.bunny.net/hero1.webp", "file_123", "Achievement 1", null, true);
        HeroImage created = heroImageService.createHeroImage(request);

        assertThat(created).isNotNull();
        assertThat(created.getUrl()).isEqualTo("https://cdn.bunny.net/hero1.webp");
        assertThat(created.getStorageKey()).isEqualTo("file_123");
        assertThat(created.getAltText()).isEqualTo("Achievement 1");
        assertThat(created.getSortOrder()).isEqualTo(0);
        assertThat(created.getActive()).isTrue();
        verify(heroImageRepository).save(any(HeroImage.class));
    }

    @Test
    @DisplayName("getActiveHeroImages returns only active hero images sorted")
    void testGetActiveHeroImages() {
        HeroImage img1 = new HeroImage("h1", "url1", "key1", 0, "Alt 1", true);
        HeroImage img2 = new HeroImage("h2", "url2", "key2", 1, "Alt 2", true);
        when(heroImageRepository.findByActiveTrueOrderBySortOrderAscCreatedAtAsc()).thenReturn(List.of(img1, img2));

        List<HeroImage> activeImages = heroImageService.getActiveHeroImages();
        assertThat(activeImages).hasSize(2);
        assertThat(activeImages.get(0).getId()).isEqualTo("h1");
        assertThat(activeImages.get(1).getId()).isEqualTo("h2");
    }

    @Test
    @DisplayName("updateOrders updates sortOrder for each image")
    void testUpdateOrders() {
        HeroImage img1 = new HeroImage("h1", "url1", "key1", 0, "Alt 1", true);
        HeroImage img2 = new HeroImage("h2", "url2", "key2", 1, "Alt 2", true);
        when(heroImageRepository.findById("h1")).thenReturn(Optional.of(img1));
        when(heroImageRepository.findById("h2")).thenReturn(Optional.of(img2));
        when(heroImageRepository.findAllByOrderBySortOrderAscCreatedAtAsc()).thenReturn(List.of(img2, img1));

        List<HeroImageOrderDto> orders = List.of(
                new HeroImageOrderDto("h1", 1),
                new HeroImageOrderDto("h2", 0)
        );

        List<HeroImage> result = heroImageService.updateOrders(orders);
        assertThat(result).hasSize(2);
        assertThat(img1.getSortOrder()).isEqualTo(1);
        assertThat(img2.getSortOrder()).isEqualTo(0);
        verify(heroImageRepository, times(2)).save(any(HeroImage.class));
    }

    @Test
    @DisplayName("deleteHeroImage purges storage file and deletes DB record")
    void testDeleteHeroImage() {
        HeroImage img = new HeroImage("h1", "url1", "storage/path/hero1.webp", 0, "Alt 1", true);
        when(heroImageRepository.findById("h1")).thenReturn(Optional.of(img));

        heroImageService.deleteHeroImage("h1");

        verify(fileStorageService).deleteFile("storage/path/hero1.webp");
        verify(storageProvider).delete("storage/path/hero1.webp");
        verify(heroImageRepository).delete(img);
    }
}
