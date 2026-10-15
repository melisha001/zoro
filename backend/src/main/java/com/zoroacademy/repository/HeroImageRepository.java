package com.zoroacademy.repository;

import com.zoroacademy.entity.HeroImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HeroImageRepository extends JpaRepository<HeroImage, String> {

    List<HeroImage> findAllByOrderBySortOrderAscCreatedAtAsc();

    List<HeroImage> findByActiveTrueOrderBySortOrderAscCreatedAtAsc();

    Optional<HeroImage> findTopByOrderBySortOrderDesc();
}
