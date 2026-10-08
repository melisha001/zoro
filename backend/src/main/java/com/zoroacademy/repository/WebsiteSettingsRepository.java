package com.zoroacademy.repository;

import com.zoroacademy.entity.WebsiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebsiteSettingsRepository extends JpaRepository<WebsiteSettings, String> {
}
