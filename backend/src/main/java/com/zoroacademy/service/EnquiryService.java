package com.zoroacademy.service;

import com.zoroacademy.entity.Enquiry;
import com.zoroacademy.repository.EnquiryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EnquiryService {

    private final EnquiryRepository enquiryRepository;
    public EnquiryService(EnquiryRepository enquiryRepository) {
        this.enquiryRepository = enquiryRepository;
    }


    @Transactional(readOnly = true)
    public List<Enquiry> getAllEnquiries() {
        return enquiryRepository.findAll();
    }

    @Transactional
    public Enquiry createEnquiry(Enquiry enquiry) {
        if (enquiry.getId() == null || enquiry.getId().isBlank()) {
            enquiry.setId("enq_" + System.currentTimeMillis());
        }
        if (enquiry.getStatus() == null || enquiry.getStatus().isBlank()) {
            enquiry.setStatus("New");
        }
        if (enquiry.getPhone() != null && !enquiry.getPhone().isBlank()) {
            enquiry.setPhone(com.zoroacademy.util.PhoneValidator.sanitize(enquiry.getPhone()));
        }
        return enquiryRepository.save(enquiry);
    }

    @Transactional
    public Enquiry updateEnquiryStatus(String id, String status) {
        Enquiry enquiry = enquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enquiry not found: " + id));

        enquiry.setStatus(status);
        return enquiryRepository.save(enquiry);
    }

    @Transactional
    public void deleteEnquiry(String id) {
        enquiryRepository.deleteById(id);
    }
}
