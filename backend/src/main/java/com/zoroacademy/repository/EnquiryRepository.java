package com.zoroacademy.repository;

import com.zoroacademy.entity.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, String> {
    List<Enquiry> findByStatusIgnoreCase(String status);
}
