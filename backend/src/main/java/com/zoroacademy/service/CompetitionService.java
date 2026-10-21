package com.zoroacademy.service;

import com.zoroacademy.entity.*;
import com.zoroacademy.exception.BadRequestException;
import com.zoroacademy.exception.ForbiddenException;
import com.zoroacademy.exception.ResourceNotFoundException;
import com.zoroacademy.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionModuleRepository moduleRepository;
    private final CompetitionRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final CompetitionSetRepository setRepository;
    private final CompetitionSetMemberRepository setMemberRepository;
    private final CompetitionSyllabusRepository syllabusRepository;
    private final CompetitionGuidanceVideoRepository guidanceVideoRepository;
    private final CompetitionStudyMaterialRepository studyMaterialRepository;
    private final CompetitionAssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final AssessmentEvaluationCriteriaRepository evaluationCriteriaRepository;
    private final StoredFileRepository storedFileRepository;

    @Autowired(required = false)
    private AssessmentAttemptRepository assessmentAttemptRepository;

    @Autowired(required = false)
    private AttemptAnswerRepository attemptAnswerRepository;

    @Autowired(required = false)
    private VoiceEvaluationScoreRepository voiceEvaluationScoreRepository;

    @Autowired(required = false)
    private LeaderboardEntryRepository leaderboardEntryRepository;

    @Autowired(required = false)
    private CompetitionLeaderboardCacheRepository leaderboardCacheRepository;

    @Autowired(required = false)
    private ResultCorrectionRepository resultCorrectionRepository;

    @Autowired(required = false)
    private AssessmentSetQuestionRepository assessmentSetQuestionRepository;

    @Autowired(required = false)
    private AssessmentSetOptionRepository assessmentSetOptionRepository;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired
    public CompetitionService(
            CompetitionRepository competitionRepository,
            CompetitionModuleRepository moduleRepository,
            CompetitionRegistrationRepository registrationRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            CompetitionSetRepository setRepository,
            CompetitionSetMemberRepository setMemberRepository,
            CompetitionSyllabusRepository syllabusRepository,
            CompetitionGuidanceVideoRepository guidanceVideoRepository,
            CompetitionStudyMaterialRepository studyMaterialRepository,
            CompetitionAssessmentRepository assessmentRepository,
            AssessmentQuestionRepository questionRepository,
            QuestionOptionRepository questionOptionRepository,
            AssessmentEvaluationCriteriaRepository evaluationCriteriaRepository,
            StoredFileRepository storedFileRepository) {
        this.competitionRepository = competitionRepository;
        this.moduleRepository = moduleRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.setRepository = setRepository;
        this.setMemberRepository = setMemberRepository;
        this.syllabusRepository = syllabusRepository;
        this.guidanceVideoRepository = guidanceVideoRepository;
        this.studyMaterialRepository = studyMaterialRepository;
        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.evaluationCriteriaRepository = evaluationCriteriaRepository;
        this.storedFileRepository = storedFileRepository;
    }

    public CompetitionService(
            CompetitionRepository competitionRepository,
            CompetitionModuleRepository moduleRepository,
            CompetitionRegistrationRepository registrationRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {
        this(competitionRepository, moduleRepository, registrationRepository, userRepository, fileStorageService,
             null, null, null, null, null, null, null, null, null, null);
    }

    public void setAssessmentAttemptRepository(AssessmentAttemptRepository assessmentAttemptRepository) {
        this.assessmentAttemptRepository = assessmentAttemptRepository;
    }

    public void setAttemptAnswerRepository(AttemptAnswerRepository attemptAnswerRepository) {
        this.attemptAnswerRepository = attemptAnswerRepository;
    }

    public void setVoiceEvaluationScoreRepository(VoiceEvaluationScoreRepository voiceEvaluationScoreRepository) {
        this.voiceEvaluationScoreRepository = voiceEvaluationScoreRepository;
    }


    public void setLeaderboardEntryRepository(LeaderboardEntryRepository leaderboardEntryRepository) {
        this.leaderboardEntryRepository = leaderboardEntryRepository;
    }

    public void setLeaderboardCacheRepository(CompetitionLeaderboardCacheRepository leaderboardCacheRepository) {
        this.leaderboardCacheRepository = leaderboardCacheRepository;
    }

    public void setResultCorrectionRepository(ResultCorrectionRepository resultCorrectionRepository) {
        this.resultCorrectionRepository = resultCorrectionRepository;
    }

    public void setAssessmentSetQuestionRepository(AssessmentSetQuestionRepository r) {
        this.assessmentSetQuestionRepository = r;
    }

    public void setAssessmentSetOptionRepository(AssessmentSetOptionRepository r) {
        this.assessmentSetOptionRepository = r;
    }

    @Transactional(readOnly = true)
    public List<Competition> getAllCompetitions() {
        return competitionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Competition getCompetitionById(String id) {
        return competitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found: " + id));
    }

    /**
     * Validates that the current user has paid registration access to the specified competition.
     * Admins and trainers are permitted; students must have a PAID registration.
     */
    public void validateUserCompetitionAccess(String compId, User user) {
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        String role = user.getRole() != null ? user.getRole().toUpperCase() : "STUDENT";
        if ("ADMIN".equals(role) || "SUPER_ADMIN".equals(role) || "TRAINER".equals(role)) {
            return;
        }

        // Student validation
        Optional<CompetitionRegistration> reg = registrationRepository.findByCompetitionIdAndStudentId(compId, user.getId());
        if (reg.isEmpty() && user.getEmail() != null) {
            reg = registrationRepository.findByCompetitionIdAndStudentEmailIgnoreCase(compId, user.getEmail());
        }
        if (reg.isEmpty() || !"PAID".equalsIgnoreCase(reg.get().getPaymentStatus())) {
            throw new ForbiddenException("Access denied: You do not have a paid registration for this competition");
        }
    }

    /**
     * Validates timing rules for competitions.
     * 1. End must be after start
     * 2. Registration closes before or when competition starts
     * 3. Final unlock must be inside the competition window
     * 4. Publish rule: 5 days after scheduled completion date at configured time.
     */
    public void validateCompetitionTimings(Competition comp) {
        ZoneId ist = ZoneId.of("Asia/Kolkata");

        if (comp.getStartAt() != null && comp.getEndAt() != null) {
            if (!comp.getEndAt().isAfter(comp.getStartAt())) {
                throw new BadRequestException("Competition end date/time must be strictly after start date/time");
            }
        }

        if (comp.getRegEndAt() != null && comp.getStartAt() != null) {
            if (comp.getRegEndAt().isAfter(comp.getStartAt())) {
                throw new BadRequestException("Registration closes before or when the competition starts");
            }
        }

        if (comp.getFinalUnlockAt() != null) {
            if (comp.getStartAt() != null && comp.getFinalUnlockAt().isBefore(comp.getStartAt())) {
                throw new BadRequestException("Final Assessment unlock time must be inside the competition window");
            }
            if (comp.getEndAt() != null && comp.getFinalUnlockAt().isAfter(comp.getEndAt())) {
                throw new BadRequestException("Final Assessment unlock time must be inside the competition window");
            }
        }

        // Publish rule: 5 days after the scheduled completion date at the configured time
        if (comp.getEndAt() != null) {
            LocalTime pubTime = LocalTime.of(18, 0);
            if (comp.getLeaderboardPublishTime() != null && !comp.getLeaderboardPublishTime().isBlank()) {
                try {
                    pubTime = parseTime(comp.getLeaderboardPublishTime().trim());
                } catch (Exception ignored) {}
            } else {
                comp.setLeaderboardPublishTime("18:00");
            }
            ZonedDateTime endZoned = comp.getEndAt().atZoneSameInstant(ist);
            ZonedDateTime pubZoned = endZoned.plusDays(5).with(pubTime);
            comp.setLeaderboardPublishedAt(pubZoned.toOffsetDateTime());
        }
    }

    @Transactional
    public Competition createCompetition(Competition competition) {
        if (competition.getId() == null || competition.getId().isBlank()) {
            competition.setId("comp_" + UUID.randomUUID());
        }

        ZoneId zone = ZoneId.of("Asia/Kolkata");
        if (competition.getStartAt() == null && competition.getStartDate() != null && !competition.getStartDate().isBlank()) {
            try {
                LocalDate d = LocalDate.parse(competition.getStartDate().trim());
                LocalTime t = (competition.getStartTime() != null && !competition.getStartTime().isBlank())
                        ? parseTime(competition.getStartTime()) : LocalTime.MIN;
                competition.setStartAt(ZonedDateTime.of(d, t, zone).toOffsetDateTime());
            } catch (Exception ignored) {}
        }
        if (competition.getEndAt() == null && competition.getEndDate() != null && !competition.getEndDate().isBlank()) {
            try {
                LocalDate d = LocalDate.parse(competition.getEndDate().trim());
                LocalTime t = (competition.getEndTime() != null && !competition.getEndTime().isBlank())
                        ? parseTime(competition.getEndTime()) : LocalTime.of(23, 59, 59);
                competition.setEndAt(ZonedDateTime.of(d, t, zone).toOffsetDateTime());
            } catch (Exception ignored) {}
        }
        if (competition.getRegStartAt() == null && competition.getRegStartDate() != null && !competition.getRegStartDate().isBlank()) {
            try {
                LocalDate d = LocalDate.parse(competition.getRegStartDate().trim());
                competition.setRegStartAt(ZonedDateTime.of(d, LocalTime.MIN, zone).toOffsetDateTime());
            } catch (Exception ignored) {}
        }
        if (competition.getRegEndAt() == null && competition.getRegEndDate() != null && !competition.getRegEndDate().isBlank()) {
            try {
                LocalDate d = LocalDate.parse(competition.getRegEndDate().trim());
                competition.setRegEndAt(ZonedDateTime.of(d, LocalTime.of(23, 59, 59), zone).toOffsetDateTime());
            } catch (Exception ignored) {}
        }

        validateCompetitionTimings(competition);

        Competition saved = competitionRepository.save(competition);
        String compId = saved.getId();

        // Auto-create 4 sets (A, B, C, D)
        if (setRepository != null) {
            for (String code : List.of("A", "B", "C", "D")) {
                if (setRepository.findByCompetitionIdAndCode(compId, code).isEmpty()) {
                    CompetitionSet set = new CompetitionSet("set_" + compId + "_" + code, compId, code);
                    setRepository.save(set);
                }
            }
        }

        // Auto-create 35 TEST_SERIES, 4 MOCK, 1 FINAL slots as DRAFT
        if (assessmentRepository != null) {
            for (int i = 1; i <= 35; i++) {
                if (assessmentRepository.findByCompetitionIdAndTypeAndSequenceNo(compId, "TEST_SERIES", i).isEmpty()) {
                    CompetitionAssessment ca = new CompetitionAssessment();
                    ca.setId("asmt_" + compId + "_ts_" + i);
                    ca.setCompetitionId(compId);
                    ca.setType("TEST_SERIES");
                    ca.setSequenceNo(i);
                    ca.setTitle("Test Series " + i);
                    ca.setStatus("DRAFT");
                    ca.setDurationMinutes(20);
                    ca.setTotalMarks(20);
                    assessmentRepository.save(ca);
                }
            }

            for (int i = 1; i <= 4; i++) {
                if (assessmentRepository.findByCompetitionIdAndTypeAndSequenceNo(compId, "MOCK", i).isEmpty()) {
                    CompetitionAssessment ca = new CompetitionAssessment();
                    ca.setId("asmt_" + compId + "_mock_" + i);
                    ca.setCompetitionId(compId);
                    ca.setType("MOCK");
                    ca.setSequenceNo(i);
                    ca.setTitle("Mock Test " + i);
                    ca.setStatus("DRAFT");
                    ca.setDurationMinutes(45);
                    ca.setTotalMarks(50);
                    assessmentRepository.save(ca);
                }
            }

            if (assessmentRepository.findByCompetitionIdAndTypeAndSequenceNo(compId, "FINAL", 1).isEmpty()) {
                CompetitionAssessment ca = new CompetitionAssessment();
                ca.setId("asmt_" + compId + "_final_1");
                ca.setCompetitionId(compId);
                ca.setType("FINAL");
                ca.setSequenceNo(1);
                ca.setTitle("Final Assessment");
                ca.setStatus("DRAFT");
                ca.setDurationMinutes(60);
                ca.setTotalMarks(100);
                assessmentRepository.save(ca);
            }
        }

        return saved;
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return LocalTime.MIDNIGHT;
        String t = timeStr.trim();
        try {
            return LocalTime.parse(t, DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));
        } catch (Exception e1) {
            try {
                return LocalTime.parse(t, DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
            } catch (Exception e2) {
                try {
                    return LocalTime.parse(t, DateTimeFormatter.ISO_LOCAL_TIME);
                } catch (Exception e3) {
                    return LocalTime.MIDNIGHT;
                }
            }
        }
    }

    @Transactional
    public CompetitionModule addModule(String compId, CompetitionModule module) {
        Competition comp = getCompetitionById(compId);
        if (module.getId() == null || module.getId().isBlank()) {
            module.setId("comp_mod_" + UUID.randomUUID());
        }
        module.setCompetition(comp);
        return moduleRepository.save(module);
    }

    @Transactional(readOnly = true)
    public List<CompetitionRegistration> getAllRegistrations() {
        return registrationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CompetitionModule> getModules(String compId) {
        return moduleRepository.findByCompetitionIdOrderByRoundNumberAsc(compId);
    }

    @Transactional(readOnly = true)
    public List<CompetitionRegistration> getRegistrations(String compId) {
        return registrationRepository.findByCompetitionId(compId);
    }

    @Transactional
    public CompetitionRegistration registerStudent(String compId, CompetitionRegistration reg) {
        Competition comp = getCompetitionById(compId);
        if (reg.getId() == null || reg.getId().isBlank()) {
            reg.setId("reg_" + UUID.randomUUID());
        }
        if (reg.getStudentPhone() != null && !reg.getStudentPhone().isBlank()) {
            reg.setStudentPhone(com.zoroacademy.util.PhoneValidator.sanitize(reg.getStudentPhone()));
        }
        if (reg.getPaymentStatus() == null || reg.getPaymentStatus().isBlank()) {
            reg.setPaymentStatus("Pending");
        }

        // Relational student resolution (if registered student)
        if (reg.getStudentId() != null && reg.getStudentId().contains("@")) {
            userRepository.findByEmailIgnoreCase(reg.getStudentId()).ifPresent(u -> {
                reg.setStudentId(u.getId());
                if (reg.getStudentEmail() == null) reg.setStudentEmail(u.getEmail());
                if (reg.getStudentName() == null) reg.setStudentName(u.getName());
            });
        } else if (reg.getStudentEmail() != null && !reg.getStudentEmail().isBlank()) {
            userRepository.findByEmailIgnoreCase(reg.getStudentEmail()).ifPresent(u -> {
                if (reg.getStudentId() == null || reg.getStudentId().isBlank()) reg.setStudentId(u.getId());
                if (reg.getStudentName() == null) reg.setStudentName(u.getName());
            });
        }

        reg.setCompetition(comp);
        CompetitionRegistration saved = registrationRepository.save(reg);
        if (emailService != null) {
            try {
                emailService.sendCompetitionRegistrationConfirmation(saved);
            } catch (Exception ignored) {}
        }
        return saved;
    }

    @Transactional
    public Competition updateCompetition(String id, Competition updated) {
        Competition comp = getCompetitionById(id);
        if (updated.getTitle() != null) comp.setTitle(updated.getTitle());
        if (updated.getCategory() != null) comp.setCategory(updated.getCategory());
        if (updated.getStartDate() != null) comp.setStartDate(updated.getStartDate());
        if (updated.getEndDate() != null) comp.setEndDate(updated.getEndDate());
        if (updated.getRegStartDate() != null) comp.setRegStartDate(updated.getRegStartDate());
        if (updated.getRegEndDate() != null) comp.setRegEndDate(updated.getRegEndDate());
        if (updated.getStartTime() != null) comp.setStartTime(updated.getStartTime());
        if (updated.getEndTime() != null) comp.setEndTime(updated.getEndTime());
        if (updated.getVenue() != null) comp.setVenue(updated.getVenue());
        if (updated.getBannerUrl() != null) {
            if (comp.getBannerUrl() != null && !comp.getBannerUrl().isBlank()
                    && !comp.getBannerUrl().equals(updated.getBannerUrl())) {
                deleteAttachedFileIfPresent(comp.getBannerUrl());
            }
            comp.setBannerUrl(updated.getBannerUrl());
        }
        if (updated.getRulesPdfUrl() != null) {
            if (comp.getRulesPdfUrl() != null && !comp.getRulesPdfUrl().isBlank()
                    && !comp.getRulesPdfUrl().equals(updated.getRulesPdfUrl())) {
                deleteAttachedFileIfPresent(comp.getRulesPdfUrl());
            }
            comp.setRulesPdfUrl(updated.getRulesPdfUrl());
        }
        if (updated.getInstructions() != null) comp.setInstructions(updated.getInstructions());
        if (updated.getContactDetails() != null) comp.setContactDetails(updated.getContactDetails());
        if (updated.getRegistrationFee() != null) comp.setRegistrationFee(updated.getRegistrationFee());
        if (updated.getDescription() != null) comp.setDescription(updated.getDescription());
        if (updated.getRules() != null) comp.setRules(updated.getRules());
        if (updated.getStatus() != null) comp.setStatus(updated.getStatus());

        // Timestamp and review fields
        if (updated.getRegStartAt() != null) comp.setRegStartAt(updated.getRegStartAt());
        if (updated.getRegEndAt() != null) comp.setRegEndAt(updated.getRegEndAt());
        if (updated.getStartAt() != null) comp.setStartAt(updated.getStartAt());
        if (updated.getEndAt() != null) comp.setEndAt(updated.getEndAt());
        if (updated.getFinalUnlockAt() != null) comp.setFinalUnlockAt(updated.getFinalUnlockAt());
        if (updated.getLeaderboardPublishTime() != null) comp.setLeaderboardPublishTime(updated.getLeaderboardPublishTime());
        if (updated.getLeaderboardStatus() != null) comp.setLeaderboardStatus(updated.getLeaderboardStatus());
        if (updated.getLeaderboardPublishedAt() != null) comp.setLeaderboardPublishedAt(updated.getLeaderboardPublishedAt());
        if (updated.getAnswerReviewEnabled() != null) comp.setAnswerReviewEnabled(updated.getAnswerReviewEnabled());

        validateCompetitionTimings(comp);

        return competitionRepository.save(comp);
    }

    @Transactional
    public void deleteCompetition(String id) {
        Competition comp = competitionRepository.findById(id).orElse(null);
        if (comp != null) {
            deleteAttachedFileIfPresent(comp.getRulesPdfUrl());
            deleteAttachedFileIfPresent(comp.getBannerUrl());
        }
        competitionRepository.deleteById(id);
    }

    private void deleteAttachedFileIfPresent(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern
                    .compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(fileUrl);
            if (m.find()) {
                String fileId = m.group();
                fileStorageService.deleteFile(fileId);
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(CompetitionService.class)
                    .warn("Could not delete attached file for {}: {}", fileUrl, e.getMessage());
        }
    }

    @Transactional
    public CompetitionModule updateModule(String moduleId, CompetitionModule updated) {
        CompetitionModule mod = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleId));
        if (updated.getTitle() != null) mod.setTitle(updated.getTitle());
        if (updated.getDescription() != null) mod.setDescription(updated.getDescription());
        if (updated.getRoundNumber() != null) mod.setRoundNumber(updated.getRoundNumber());
        if (updated.getAssessmentData() != null) mod.setAssessmentData(updated.getAssessmentData());
        return moduleRepository.save(mod);
    }

    @Transactional
    public void deleteModule(String moduleId) {
        moduleRepository.deleteById(moduleId);
    }

    @Transactional
    public CompetitionRegistration updateRegistration(String regId, CompetitionRegistration updated) {
        CompetitionRegistration reg = registrationRepository.findById(regId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found: " + regId));
        if (updated.getPaymentStatus() != null) reg.setPaymentStatus(updated.getPaymentStatus());
        if (updated.getRazorpayOrderId() != null) reg.setRazorpayOrderId(updated.getRazorpayOrderId());
        if (updated.getRazorpayPaymentId() != null) reg.setRazorpayPaymentId(updated.getRazorpayPaymentId());
        if (updated.getAmount() != null) {
            reg.setAmount(updated.getAmount());
            reg.setAmountPaise(updated.getAmount().multiply(java.math.BigDecimal.valueOf(100)).longValue());
        } else if (updated.getAmountPaise() != null) {
            reg.setAmountPaise(updated.getAmountPaise());
            reg.setAmount(java.math.BigDecimal.valueOf(updated.getAmountPaise()).divide(java.math.BigDecimal.valueOf(100)));
        }
        if (updated.getPaidAt() != null) reg.setPaidAt(updated.getPaidAt());
        if (updated.getScore() != null) reg.setScore(updated.getScore());
        if (updated.getRank() != null) reg.setRank(updated.getRank());
        if (updated.getCertificateUrl() != null) reg.setCertificateUrl(updated.getCertificateUrl());
        return registrationRepository.save(reg);
    }

    @Transactional
    public void deleteRegistration(String regId) {
        registrationRepository.deleteById(regId);
    }

    // --- Sets & Trainers Management (Phase 5) ---
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSetsWithDetails(String compId) {
        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(compId);
        if (sets.isEmpty()) {
            for (String code : List.of("A", "B", "C", "D")) {
                CompetitionSet set = new CompetitionSet("set_" + compId + "_" + code, compId, code);
                sets.add(setRepository.save(set));
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (CompetitionSet s : sets) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("competitionId", s.getCompetitionId());
            map.put("code", s.getCode());
            map.put("trainerId", s.getTrainerId());
            long count = setMemberRepository.countBySetId(s.getId());
            map.put("memberCount", count);

            if (s.getTrainerId() != null) {
                userRepository.findById(s.getTrainerId()).ifPresent(u -> {
                    map.put("trainerName", u.getName());
                    map.put("trainerEmail", u.getEmail());
                });
            }
            result.add(map);
        }
        return result;
    }

    @Transactional
    public CompetitionSet assignTrainerToSet(String compId, String setCode, String trainerId) {
        CompetitionSet set = setRepository.findByCompetitionIdAndCode(compId, setCode)
                .orElseThrow(() -> new ResourceNotFoundException("Set " + setCode + " not found for competition " + compId));
        if (trainerId != null && !trainerId.isBlank()) {
            User trainer = userRepository.findById(trainerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Trainer not found: " + trainerId));
            set.setTrainerId(trainer.getId());
        } else {
            set.setTrainerId(null);
        }
        return setRepository.save(set);
    }

    // --- Syllabus (Phase 6) ---
    @Transactional(readOnly = true)
    public Map<String, Object> getSyllabus(String compId) {
        Optional<CompetitionSyllabus> syllabusOpt = syllabusRepository.findByCompetitionId(compId);
        if (syllabusOpt.isEmpty()) {
            return null;
        }
        CompetitionSyllabus syllabus = syllabusOpt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("id", syllabus.getId());
        result.put("competitionId", syllabus.getCompetitionId());
        result.put("title", syllabus.getTitle());
        result.put("storedFileId", syllabus.getStoredFileId());
        result.put("fileType", syllabus.getFileType());
        result.put("updatedAt", syllabus.getUpdatedAt());

        if (syllabus.getStoredFileId() != null) {
            storedFileRepository.findById(syllabus.getStoredFileId()).ifPresent(sf -> {
                Map<String, Object> link = fileStorageService.generateFileLink(sf, 3600);
                result.put("viewUrl", link.get("url"));
                result.put("fileName", sf.getOriginalName());
            });
        }
        return result;
    }

    @Transactional
    public CompetitionSyllabus saveSyllabus(String compId, String title, String storedFileId, String fileType) {
        Competition comp = getCompetitionById(compId);

        // Validation: syllabus must be PDF, DOC/DOCX, or TXT
        if (storedFileId != null && !storedFileId.isBlank()) {
            StoredFile sf = storedFileRepository.findById(storedFileId)
                    .orElseThrow(() -> new ResourceNotFoundException("Stored file not found: " + storedFileId));
            String name = (sf.getOriginalName() != null ? sf.getOriginalName().toLowerCase(Locale.ROOT) : "");
            boolean isValidExt = name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx") || name.endsWith(".txt");
            if (!isValidExt) {
                throw new BadRequestException("Syllabus file must be PDF, DOC, DOCX, or TXT format. Media files are not allowed.");
            }
        }

        CompetitionSyllabus syllabus = syllabusRepository.findByCompetitionId(compId)
                .orElseGet(() -> {
                    CompetitionSyllabus s = new CompetitionSyllabus();
                    s.setId("syl_" + UUID.randomUUID());
                    s.setCompetitionId(comp.getId());
                    return s;
                });

        if (syllabus.getStoredFileId() != null && !syllabus.getStoredFileId().equals(storedFileId)) {
            fileStorageService.deleteFile(syllabus.getStoredFileId());
        }

        syllabus.setTitle(title != null ? title : "Competition Syllabus");
        if (storedFileId != null) syllabus.setStoredFileId(storedFileId);
        if (fileType != null) syllabus.setFileType(fileType);
        return syllabusRepository.save(syllabus);
    }

    @Transactional
    public void deleteSyllabus(String compId) {
        syllabusRepository.findByCompetitionId(compId).ifPresent(syl -> {
            if (syl.getStoredFileId() != null) {
                fileStorageService.deleteFile(syl.getStoredFileId());
            }
            syllabusRepository.delete(syl);
        });
    }

    // --- Guidance Videos (Phase 6) ---
    @Transactional(readOnly = true)
    public List<CompetitionGuidanceVideo> getGuidanceVideos(String compId) {
        return guidanceVideoRepository.findByCompetitionIdOrderBySortOrderAsc(compId);
    }

    @Transactional
    public CompetitionGuidanceVideo saveGuidanceVideo(String compId, CompetitionGuidanceVideo video) {
        Competition comp = getCompetitionById(compId);
        if (video.getId() == null || video.getId().isBlank()) {
            video.setId("cgv_" + UUID.randomUUID());
        }
        video.setCompetitionId(comp.getId());
        return guidanceVideoRepository.save(video);
    }

    @Transactional
    public void deleteGuidanceVideo(String videoId) {
        guidanceVideoRepository.deleteById(videoId);
    }

    // --- Study Materials (Phase 6) ---
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudyMaterials(String compId) {
        List<CompetitionStudyMaterial> materials = studyMaterialRepository.findByCompetitionIdOrderBySortOrderAsc(compId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (CompetitionStudyMaterial sm : materials) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", sm.getId());
            map.put("competitionId", sm.getCompetitionId());
            map.put("title", sm.getTitle());
            map.put("storedFileId", sm.getStoredFileId());
            map.put("fileType", sm.getFileType());
            map.put("sortOrder", sm.getSortOrder());
            map.put("createdAt", sm.getCreatedAt());

            if (sm.getStoredFileId() != null) {
                storedFileRepository.findById(sm.getStoredFileId()).ifPresent(sf -> {
                    Map<String, Object> link = fileStorageService.generateFileLink(sf, 3600);
                    map.put("viewUrl", link.get("url"));
                    map.put("fileName", sf.getOriginalName());
                });
            }
            result.add(map);
        }
        return result;
    }

    @Transactional
    public CompetitionStudyMaterial saveStudyMaterial(String compId, CompetitionStudyMaterial material) {
        Competition comp = getCompetitionById(compId);

        // Validation: study material must be PDF, DOC/DOCX, or TXT
        if (material.getStoredFileId() != null && !material.getStoredFileId().isBlank()) {
            StoredFile sf = storedFileRepository.findById(material.getStoredFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Stored file not found: " + material.getStoredFileId()));
            String name = (sf.getOriginalName() != null ? sf.getOriginalName().toLowerCase(Locale.ROOT) : "");
            boolean isValidExt = name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx") || name.endsWith(".txt");
            if (!isValidExt) {
                throw new BadRequestException("Study material file must be PDF, DOC, DOCX, or TXT format. Media files are not allowed.");
            }
        }

        if (material.getId() == null || material.getId().isBlank()) {
            material.setId("csm_" + UUID.randomUUID());
        }
        material.setCompetitionId(comp.getId());
        return studyMaterialRepository.save(material);
    }

    @Transactional
    public void deleteStudyMaterial(String materialId) {
        studyMaterialRepository.findById(materialId).ifPresent(mat -> {
            if (mat.getStoredFileId() != null) {
                fileStorageService.deleteFile(mat.getStoredFileId());
            }
            studyMaterialRepository.delete(mat);
        });
    }

    // --- Assessments (Phase 7) ---
    @Transactional(readOnly = true)
    public List<CompetitionAssessment> getAssessments(String compId) {
        return assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(compId);
    }

    @Transactional(readOnly = true)
    public CompetitionAssessment getAssessmentById(String asmtId) {
        return assessmentRepository.findById(asmtId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found: " + asmtId));
    }

    @Transactional
    public CompetitionAssessment updateAssessment(String asmtId, CompetitionAssessment updated) {
        CompetitionAssessment asmt = getAssessmentById(asmtId);
        if (updated.getTitle() != null) asmt.setTitle(updated.getTitle());
        if (updated.getStatus() != null) asmt.setStatus(updated.getStatus());
        if (updated.getStartAt() != null) asmt.setStartAt(updated.getStartAt());
        if (updated.getEndAt() != null) asmt.setEndAt(updated.getEndAt());
        if (updated.getDurationMinutes() != null) asmt.setDurationMinutes(updated.getDurationMinutes());
        if (updated.getTotalMarks() != null) asmt.setTotalMarks(updated.getTotalMarks());
        return assessmentRepository.save(asmt);
    }

    /**
     * Publishes an assessment with comprehensive server-side rule verification.
     */
    @Transactional
    public CompetitionAssessment publishAssessment(String asmtId) {
        CompetitionAssessment asmt = getAssessmentById(asmtId);
        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmtId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Assessment must have at least one question before publishing");
        }

        int computedTotalMarks = 0;
        for (AssessmentQuestion q : questions) {
            computedTotalMarks += (q.getMarks() != null ? q.getMarks() : 1);
            if ("MCQ_OPTIONS".equalsIgnoreCase(q.getAnswerFormat())) {
                List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
                if (options.size() < 2) {
                    throw new BadRequestException("Every MCQ question must have at least 2 options: " + q.getQuestionText());
                }
                long correctCount = options.stream().filter(o -> Boolean.TRUE.equals(o.getIsCorrect())).count();
                if (correctCount != 1) {
                    throw new BadRequestException("Every MCQ question must have exactly one correct option: " + q.getQuestionText());
                }
            }
        }
        asmt.setTotalMarks(computedTotalMarks);

        Competition comp = getCompetitionById(asmt.getCompetitionId());

        if ("MOCK".equalsIgnoreCase(asmt.getType())) {
            if (asmt.getStartAt() == null || asmt.getEndAt() == null) {
                throw new BadRequestException("Mock tests require explicit start and end date/time to be set");
            }
            if (!asmt.getEndAt().isAfter(asmt.getStartAt())) {
                throw new BadRequestException("Mock test end time must be after start time");
            }
            if (comp.getStartAt() != null && asmt.getStartAt().isBefore(comp.getStartAt())) {
                throw new BadRequestException("Mock test schedule must fall within the competition timeline");
            }
            if (comp.getEndAt() != null && asmt.getEndAt().isAfter(comp.getEndAt())) {
                throw new BadRequestException("Mock test schedule must fall within the competition timeline");
            }
        }

        if ("FINAL".equalsIgnoreCase(asmt.getType())) {
            if (asmt.getDurationMinutes() == null || asmt.getDurationMinutes() <= 0) {
                throw new BadRequestException("Final Assessment duration minutes must be configured (> 0)");
            }
            if (comp.getFinalUnlockAt() == null) {
                throw new BadRequestException("Final Assessment unlock date/time must be configured on the competition");
            }
            List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(comp.getId());
            for (String code : List.of("A", "B", "C", "D")) {
                boolean hasTrainer = sets.stream()
                        .anyMatch(s -> code.equalsIgnoreCase(s.getCode()) && s.getTrainerId() != null && !s.getTrainerId().isBlank());
                if (!hasTrainer) {
                    throw new BadRequestException("All four set trainers (Sets A, B, C, D) must be assigned before publishing the Final Assessment");
                }
            }
        }

        asmt.setStatus("PUBLISHED");
        return assessmentRepository.save(asmt);
    }

    // --- Questions Builder (Phase 7) ---
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAssessmentQuestions(String asmtId) {
        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmtId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AssessmentQuestion q : questions) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", q.getId());
            map.put("assessmentId", q.getAssessmentId());
            map.put("sortOrder", q.getSortOrder());
            map.put("questionFormat", q.getQuestionFormat());
            map.put("questionText", q.getQuestionText());
            map.put("mediaRef", q.getMediaRef());
            map.put("answerFormat", q.getAnswerFormat());
            map.put("guidanceText", q.getGuidanceText());
            map.put("maxDurationSeconds", q.getMaxDurationSeconds());
            map.put("marks", q.getMarks());
            map.put("explanation", q.getExplanation());
            map.put("status", q.getStatus());

            List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
            map.put("options", options);

            List<AssessmentEvaluationCriteria> criteria = evaluationCriteriaRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
            map.put("evaluationCriteria", criteria);

            result.add(map);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    @Transactional
    public Map<String, Object> saveQuestion(String asmtId, Map<String, Object> payload) {
        CompetitionAssessment asmt = getAssessmentById(asmtId);

        String qId = (String) payload.get("id");
        boolean isNew = (qId == null || qId.isBlank() || !questionRepository.existsById(qId));

        // Check attempt lock: once attempts exist, structural modification is blocked
        if (assessmentAttemptRepository != null && assessmentAttemptRepository.countByAssessmentId(asmtId) > 0) {
            if (isNew) {
                throw new BadRequestException("Cannot add new questions to an assessment that already has student attempts");
            }
            AssessmentQuestion existing = questionRepository.findById(qId).orElseThrow();
            if (payload.containsKey("marks") && ((Number) payload.get("marks")).intValue() != existing.getMarks()) {
                throw new BadRequestException("Cannot modify marks of a question once attempts exist");
            }
            if (payload.containsKey("options")) {
                throw new BadRequestException("Cannot modify question options once attempts exist");
            }
        }

        String qFormat = (String) payload.getOrDefault("questionFormat", "MCQ");
        String aFormat = (String) payload.getOrDefault("answerFormat", "MCQ_OPTIONS");

        // Format restrictions: Test Series 1-30 accept ONLY MCQ question + MCQ Options answers
        if ("TEST_SERIES".equalsIgnoreCase(asmt.getType()) && asmt.getSequenceNo() != null && asmt.getSequenceNo() <= 30) {
            if (!"MCQ".equalsIgnoreCase(qFormat) || !"MCQ_OPTIONS".equalsIgnoreCase(aFormat)) {
                throw new BadRequestException("Test Series 1-30 accept ONLY MCQ question format and MCQ options answer format");
            }
        }

        // Fill in the blank is rejected everywhere
        if ("FILL_BLANK".equalsIgnoreCase(qFormat) || "FILL_BLANK".equalsIgnoreCase(aFormat) || "TEXT".equalsIgnoreCase(aFormat)) {
            throw new BadRequestException("Fill-in-the-blank or free text format is not supported");
        }

        AssessmentQuestion q = isNew ? new AssessmentQuestion() : questionRepository.findById(qId).orElse(new AssessmentQuestion());
        if (isNew) {
            q.setId("aq_" + UUID.randomUUID());
        }
        q.setAssessmentId(asmtId);
        if (payload.get("questionText") != null) q.setQuestionText((String) payload.get("questionText"));
        if (payload.get("questionFormat") != null) q.setQuestionFormat(qFormat);
        if (payload.get("answerFormat") != null) q.setAnswerFormat(aFormat);
        if (payload.get("mediaRef") != null) q.setMediaRef((String) payload.get("mediaRef"));
        if (payload.get("guidanceText") != null) q.setGuidanceText((String) payload.get("guidanceText"));
        if (payload.get("maxDurationSeconds") != null) q.setMaxDurationSeconds(((Number) payload.get("maxDurationSeconds")).intValue());
        if (payload.get("marks") != null) q.setMarks(((Number) payload.get("marks")).intValue());
        if (payload.get("sortOrder") != null) q.setSortOrder(((Number) payload.get("sortOrder")).intValue());
        if (payload.get("explanation") != null) q.setExplanation((String) payload.get("explanation"));
        if (payload.get("status") != null) q.setStatus((String) payload.get("status"));
        q = questionRepository.save(q);

        // Options
        if (payload.containsKey("options")) {
            questionOptionRepository.deleteByQuestionId(q.getId());
            List<Map<String, Object>> optionsList = (List<Map<String, Object>>) payload.get("options");
            if (optionsList != null) {
                int order = 0;
                for (Map<String, Object> optMap : optionsList) {
                    QuestionOption opt = new QuestionOption();
                    if (optMap.get("id") != null && !((String) optMap.get("id")).isBlank()) {
                        try { opt.setId(UUID.fromString((String) optMap.get("id"))); } catch (Exception ignored) {}
                    }
                    opt.setQuestionId(q.getId());
                    opt.setText((String) optMap.get("text"));
                    opt.setIsCorrect(Boolean.TRUE.equals(optMap.get("isCorrect")));
                    opt.setSortOrder(optMap.get("sortOrder") != null ? ((Number) optMap.get("sortOrder")).intValue() : order++);
                    questionOptionRepository.save(opt);
                }
            }
        }

        // Voice Evaluation Criteria
        if (payload.containsKey("evaluationCriteria")) {
            evaluationCriteriaRepository.deleteByQuestionId(q.getId());
            List<Map<String, Object>> criteriaList = (List<Map<String, Object>>) payload.get("evaluationCriteria");
            if (criteriaList != null) {
                int cOrder = 0;
                for (Map<String, Object> cMap : criteriaList) {
                    AssessmentEvaluationCriteria crit = new AssessmentEvaluationCriteria();
                    crit.setId("aec_" + UUID.randomUUID());
                    crit.setQuestionId(q.getId());
                    crit.setTitle((String) cMap.get("title"));
                    crit.setMaxMarks(cMap.get("maxMarks") != null ? ((Number) cMap.get("maxMarks")).intValue() : 5);
                    crit.setSortOrder(cMap.get("sortOrder") != null ? ((Number) cMap.get("sortOrder")).intValue() : cOrder++);
                    evaluationCriteriaRepository.save(crit);
                }
            }
        }

        final String finalQId = q.getId();
        return getAssessmentQuestions(asmtId).stream().filter(m -> finalQId.equals(m.get("id"))).findFirst().orElse(null);
    }

    @Transactional
    public void deleteQuestion(String questionId) {
        AssessmentQuestion q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (assessmentAttemptRepository != null && assessmentAttemptRepository.countByAssessmentId(q.getAssessmentId()) > 0) {
            throw new BadRequestException("Cannot delete question from an assessment that already has student attempts");
        }
        questionRepository.delete(q);
    }

    // --- Student Competition Portal Context ---
    @Transactional(readOnly = true)
    public Map<String, Object> getStudentPortalContext(String compId, User user) {
        Competition comp = getCompetitionById(compId);

        List<CompetitionRegistration> regs = new ArrayList<>(registrationRepository.findByStudentId(user.getId()));
        if (user.getEmail() != null) {
            for (CompetitionRegistration r : registrationRepository.findByStudentEmailIgnoreCase(user.getEmail())) {
                if (regs.stream().noneMatch(existing -> existing.getId().equals(r.getId()))) {
                    regs.add(r);
                }
            }
        }

        CompetitionRegistration reg = regs.stream()
                .filter(r -> (r.getCompetition() != null && compId.equals(r.getCompetition().getId()))
                        || compId.equals(r.getCompetitionId()))
                .filter(r -> "PAID".equalsIgnoreCase(r.getPaymentStatus()))
                .findFirst()
                .orElse(null);

        if ("STUDENT".equalsIgnoreCase(user.getRole()) && reg == null) {
            throw new ForbiddenException("You are not registered for this competition");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("competition", comp);
        result.put("registration", reg);
        result.put("serverNow", OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));

        if (reg != null) {
            Optional<CompetitionSetMember> memberOpt = setMemberRepository.findByRegistrationId(reg.getId());
            if (memberOpt.isPresent()) {
                CompetitionSetMember member = memberOpt.get();
                setRepository.findById(member.getSetId()).ifPresent(set -> {
                    Map<String, Object> setMap = new HashMap<>();
                    setMap.put("id", set.getId());
                    setMap.put("code", set.getCode());
                    if (set.getTrainerId() != null) {
                        userRepository.findById(set.getTrainerId()).ifPresent(t -> {
                            setMap.put("trainerName", t.getName());
                            setMap.put("trainerEmail", t.getEmail());
                        });
                    }
                    result.put("set", setMap);
                });
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCompetitionOverview(String compId) {
        Competition comp = getCompetitionById(compId);
        List<CompetitionRegistration> regs = registrationRepository.findByCompetitionId(compId);
        long totalRegs = regs.size();
        long paidRegs = regs.stream().filter(r -> "PAID".equalsIgnoreCase(r.getPaymentStatus())).count();
        long pendingRegs = totalRegs - paidRegs;

        List<Map<String, Object>> setsDetails = getSetsWithDetails(compId);

        boolean hasSyllabus = syllabusRepository.findByCompetitionId(compId).isPresent();
        long videoCount = guidanceVideoRepository.findByCompetitionIdOrderBySortOrderAsc(compId).size();
        long materialCount = studyMaterialRepository.findByCompetitionIdOrderBySortOrderAsc(compId).size();

        List<CompetitionAssessment> asmts = assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(compId);
        long publishedAsmts = asmts.stream().filter(a -> "PUBLISHED".equalsIgnoreCase(a.getStatus())).count();

        Map<String, Object> evalsProgress = new HashMap<>();
        long totalAttempts = assessmentAttemptRepository != null ? assessmentAttemptRepository.count() : 0;
        evalsProgress.put("totalAttempts", totalAttempts);

        Map<String, Object> overview = new HashMap<>();
        overview.put("competition", comp);
        overview.put("totalRegistrations", totalRegs);
        overview.put("paidRegistrations", paidRegs);
        overview.put("pendingRegistrations", pendingRegs);
        overview.put("sets", setsDetails);
        overview.put("hasSyllabus", hasSyllabus);
        overview.put("guidanceVideosCount", videoCount);
        overview.put("studyMaterialsCount", materialCount);
        overview.put("totalAssessmentsCount", asmts.size());
        overview.put("publishedAssessmentsCount", publishedAsmts);
        overview.put("evaluationsProgress", evalsProgress);
        overview.put("serverNow", OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));

        return overview;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRegisteredStudentsWithDetails(String compId) {
        List<CompetitionRegistration> regs = registrationRepository.findByCompetitionId(compId);
        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(compId);
        Map<String, String> setIdToCode = sets.stream().collect(Collectors.toMap(CompetitionSet::getId, CompetitionSet::getCode, (a, b) -> a));

        List<Map<String, Object>> list = new ArrayList<>();
        for (CompetitionRegistration r : regs) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("studentId", r.getStudentId());
            item.put("studentName", r.getStudentName());
            item.put("studentEmail", r.getStudentEmail());
            item.put("studentPhone", r.getStudentPhone());
            item.put("paymentStatus", r.getPaymentStatus());
            item.put("amount", r.getAmount());
            item.put("amountPaise", r.getAmountPaise());
            item.put("createdAt", r.getCreatedAt());
            item.put("paidAt", r.getPaidAt());

            Optional<CompetitionSetMember> mem = setMemberRepository.findByRegistrationId(r.getId());
            if (mem.isPresent()) {
                item.put("setId", mem.get().getSetId());
                item.put("setCode", setIdToCode.get(mem.get().getSetId()));
            } else {
                item.put("setId", null);
                item.put("setCode", null);
            }
            list.add(item);
        }
        return list;
    }

    @Transactional
    public Map<String, Object> duplicateQuestion(String questionId) {
        AssessmentQuestion q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (assessmentAttemptRepository != null && assessmentAttemptRepository.countByAssessmentId(q.getAssessmentId()) > 0) {
            throw new BadRequestException("Cannot duplicate question in an assessment that already has student attempts");
        }

        AssessmentQuestion copy = new AssessmentQuestion();
        copy.setId("aq_" + UUID.randomUUID());
        copy.setAssessmentId(q.getAssessmentId());
        copy.setQuestionFormat(q.getQuestionFormat());
        copy.setQuestionText(q.getQuestionText() + " (Copy)");
        copy.setMediaRef(q.getMediaRef());
        copy.setAnswerFormat(q.getAnswerFormat());
        copy.setGuidanceText(q.getGuidanceText());
        copy.setMaxDurationSeconds(q.getMaxDurationSeconds());
        copy.setMarks(q.getMarks());
        copy.setSortOrder(q.getSortOrder() != null ? q.getSortOrder() + 1 : 1);
        copy.setExplanation(q.getExplanation());
        copy.setStatus(q.getStatus());
        AssessmentQuestion savedCopy = questionRepository.save(copy);

        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
        for (QuestionOption opt : options) {
            QuestionOption optCopy = new QuestionOption();
            optCopy.setQuestionId(savedCopy.getId());
            optCopy.setText(opt.getText());
            optCopy.setIsCorrect(opt.getIsCorrect());
            optCopy.setSortOrder(opt.getSortOrder());
            questionOptionRepository.save(optCopy);
        }

        List<AssessmentEvaluationCriteria> criteria = evaluationCriteriaRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
        for (AssessmentEvaluationCriteria crit : criteria) {
            AssessmentEvaluationCriteria critCopy = new AssessmentEvaluationCriteria();
            critCopy.setId("aec_" + UUID.randomUUID());
            critCopy.setQuestionId(savedCopy.getId());
            critCopy.setTitle(crit.getTitle());
            critCopy.setMaxMarks(crit.getMaxMarks());
            critCopy.setSortOrder(crit.getSortOrder());
            evaluationCriteriaRepository.save(critCopy);
        }

        return getAssessmentQuestions(savedCopy.getAssessmentId()).stream()
                .filter(m -> savedCopy.getId().equals(m.get("id")))
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public List<Map<String, Object>> reorderQuestions(String asmtId, List<String> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) return getAssessmentQuestions(asmtId);
        for (int i = 0; i < questionIds.size(); i++) {
            String qId = questionIds.get(i);
            Optional<AssessmentQuestion> qOpt = questionRepository.findById(qId);
            if (qOpt.isPresent() && asmtId.equals(qOpt.get().getAssessmentId())) {
                AssessmentQuestion q = qOpt.get();
                q.setSortOrder(i);
                questionRepository.save(q);
            }
        }
        return getAssessmentQuestions(asmtId);
    }

    // --- Phase 1: Test Series & Assessment Execution ---

    public CompetitionRegistration getStudentPaidRegistration(String compId, User user) {
        if (user == null) return null;
        List<CompetitionRegistration> regs = new ArrayList<>(registrationRepository.findByStudentId(user.getId()));
        if (user.getEmail() != null) {
            for (CompetitionRegistration r : registrationRepository.findByStudentEmailIgnoreCase(user.getEmail())) {
                if (regs.stream().noneMatch(existing -> existing.getId().equals(r.getId()))) {
                    regs.add(r);
                }
            }
        }
        return regs.stream()
                .filter(r -> (r.getCompetition() != null && compId.equals(r.getCompetition().getId()))
                        || compId.equals(r.getCompetitionId()))
                .filter(r -> "PAID".equalsIgnoreCase(r.getPaymentStatus()))
                .findFirst()
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentTestSeries(String compId, User user) {
        Competition comp = getCompetitionById(compId);
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();

        CompetitionRegistration reg = null;
        if ("STUDENT".equals(role)) {
            reg = getStudentPaidRegistration(compId, user);
            if (reg == null) {
                throw new ForbiddenException("You are not registered for this competition");
            }
        } else {
            reg = getStudentPaidRegistration(compId, user);
        }

        List<CompetitionAssessment> asmts = assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(compId)
                .stream()
                .filter(a -> "TEST_SERIES".equalsIgnoreCase(a.getType()))
                .collect(Collectors.toList());

        List<Map<String, Object>> testList = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        String regId = reg != null ? reg.getId() : (user != null ? "reg_admin_" + user.getId() : null);

        for (CompetitionAssessment a : asmts) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getId());
            item.put("competitionId", a.getCompetitionId());
            item.put("type", a.getType());
            item.put("sequenceNo", a.getSequenceNo());
            item.put("title", a.getTitle());
            item.put("durationMinutes", a.getDurationMinutes());
            item.put("totalMarks", a.getTotalMarks());
            item.put("status", a.getStatus()); // DRAFT or PUBLISHED

            boolean isPublished = "PUBLISHED".equalsIgnoreCase(a.getStatus());
            long questionCount = questionRepository.countByAssessmentId(a.getId());
            item.put("questionCount", questionCount);

            if (!isPublished) {
                item.put("attemptStatus", "UNPUBLISHED");
            } else if (regId != null && assessmentAttemptRepository != null) {
                Optional<AssessmentAttempt> attOpt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(a.getId(), regId);
                if (attOpt.isEmpty()) {
                    item.put("attemptStatus", "NOT_STARTED");
                } else {
                    AssessmentAttempt att = attOpt.get();
                    item.put("attemptStatus", att.getStatus());
                    item.put("attemptId", att.getId());
                    item.put("startedAt", att.getStartedAt());
                    item.put("submittedAt", att.getSubmittedAt());
                    item.put("mcqMarks", att.getMcqMarks());
                    item.put("voiceMarks", att.getVoiceMarks());
                    item.put("totalMarksAwarded", att.getTotalMarks());

                    if (attemptAnswerRepository != null) {
                        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(att.getId());
                        item.put("answeredCount", answers.size());
                        long voiceTotal = answers.stream().filter(ans -> ans.getVoiceFileId() != null && !ans.getVoiceFileId().isBlank()).count();
                        long voiceEvaluated = answers.stream().filter(ans -> "EVALUATED".equalsIgnoreCase(ans.getEvaluationStatus()) && ans.getVoiceFileId() != null).count();
                        item.put("voiceQuestionsCount", voiceTotal);
                        item.put("voiceEvaluatedCount", voiceEvaluated);
                    }
                }
            } else {
                item.put("attemptStatus", "NOT_STARTED");
            }
            testList.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("competitionId", compId);
        response.put("competitionTitle", comp.getTitle());
        response.put("testSeries", testList);
        response.put("serverNow", now);
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentMockTests(String compId, User user) {
        Competition comp = getCompetitionById(compId);
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();

        CompetitionRegistration reg = null;
        if ("STUDENT".equals(role)) {
            reg = getStudentPaidRegistration(compId, user);
            if (reg == null) {
                throw new ForbiddenException("You are not registered for this competition");
            }
        } else {
            reg = getStudentPaidRegistration(compId, user);
        }

        List<CompetitionAssessment> mocks = assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(compId)
                .stream()
                .filter(a -> "MOCK".equalsIgnoreCase(a.getType()))
                .collect(Collectors.toList());

        List<Map<String, Object>> mockList = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        String regId = reg != null ? reg.getId() : (user != null ? "reg_admin_" + user.getId() : null);

        for (CompetitionAssessment a : mocks) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getId());
            item.put("competitionId", a.getCompetitionId());
            item.put("type", a.getType());
            item.put("sequenceNo", a.getSequenceNo());
            item.put("title", a.getTitle());
            item.put("durationMinutes", a.getDurationMinutes());
            item.put("totalMarks", a.getTotalMarks());
            item.put("startAt", a.getStartAt());
            item.put("endAt", a.getEndAt());
            item.put("status", a.getStatus()); // DRAFT or PUBLISHED

            boolean isPublished = "PUBLISHED".equalsIgnoreCase(a.getStatus());
            long questionCount = questionRepository.countByAssessmentId(a.getId());
            item.put("questionCount", questionCount);

            // Determine Window Status & Attempt Status
            String windowStatus = "UPCOMING";
            long secondsToStart = 0;
            long secondsToEnd = 0;

            if (a.getStartAt() != null && a.getEndAt() != null) {
                if (now.isBefore(a.getStartAt())) {
                    windowStatus = "UPCOMING";
                    secondsToStart = java.time.Duration.between(now, a.getStartAt()).getSeconds();
                } else if (now.isAfter(a.getEndAt())) {
                    windowStatus = "EXPIRED";
                } else {
                    windowStatus = "LIVE";
                    secondsToEnd = java.time.Duration.between(now, a.getEndAt()).getSeconds();
                }
            } else {
                windowStatus = isPublished ? "LIVE" : "DRAFT";
            }
            item.put("windowStatus", windowStatus);
            item.put("secondsToStart", secondsToStart);
            item.put("secondsToEnd", secondsToEnd);

            if (!isPublished) {
                item.put("attemptStatus", "UNPUBLISHED");
            } else if (regId != null && assessmentAttemptRepository != null) {
                Optional<AssessmentAttempt> attOpt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(a.getId(), regId);
                if (attOpt.isEmpty()) {
                    if ("UPCOMING".equals(windowStatus)) {
                        item.put("attemptStatus", "UPCOMING_LOCKED");
                    } else if ("EXPIRED".equals(windowStatus)) {
                        item.put("attemptStatus", "MISSED");
                    } else {
                        item.put("attemptStatus", "NOT_STARTED");
                    }
                } else {
                    AssessmentAttempt att = attOpt.get();
                    item.put("attemptStatus", att.getStatus());
                    item.put("attemptId", att.getId());
                    item.put("startedAt", att.getStartedAt());
                    item.put("submittedAt", att.getSubmittedAt());
                    item.put("mcqMarks", att.getMcqMarks());
                    item.put("voiceMarks", att.getVoiceMarks());
                    item.put("totalMarksAwarded", att.getTotalMarks());

                    if (attemptAnswerRepository != null) {
                        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(att.getId());
                        item.put("answeredCount", answers.size());
                        long voiceTotal = answers.stream().filter(ans -> ans.getVoiceFileId() != null && !ans.getVoiceFileId().isBlank()).count();
                        long voiceEvaluated = answers.stream().filter(ans -> "EVALUATED".equalsIgnoreCase(ans.getEvaluationStatus()) && ans.getVoiceFileId() != null).count();
                        item.put("voiceQuestionsCount", voiceTotal);
                        item.put("voiceEvaluatedCount", voiceEvaluated);
                    }
                }
            } else {
                item.put("attemptStatus", "UPCOMING".equals(windowStatus) ? "UPCOMING_LOCKED" : "NOT_STARTED");
            }
            mockList.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("competitionId", compId);
        response.put("competitionTitle", comp.getTitle());
        response.put("mockTests", mockList);
        response.put("serverNow", now);
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentFinalAssessment(String compId, User user) {
        Competition comp = getCompetitionById(compId);
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();

        CompetitionRegistration reg = null;
        if ("STUDENT".equals(role)) {
            reg = getStudentPaidRegistration(compId, user);
            if (reg == null) {
                throw new ForbiddenException("You are not registered for this competition");
            }
        } else {
            reg = getStudentPaidRegistration(compId, user);
        }

        CompetitionAssessment finalAsmt = assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(compId)
                .stream()
                .filter(a -> "FINAL".equalsIgnoreCase(a.getType()))
                .findFirst()
                .orElse(null);

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        Map<String, Object> response = new HashMap<>();
        response.put("competitionId", compId);
        response.put("competitionTitle", comp.getTitle());
        response.put("serverNow", now);

        // Student's Assigned Set
        Map<String, Object> assignedSetMap = null;
        if (reg != null) {
            Optional<CompetitionSetMember> memOpt = setMemberRepository.findByRegistrationId(reg.getId());
            if (memOpt.isPresent()) {
                String assignedSetId = memOpt.get().getSetId();
                Optional<CompetitionSet> setOpt = setRepository.findById(assignedSetId);
                if (setOpt.isPresent()) {
                    CompetitionSet s = setOpt.get();
                    Map<String, Object> setMap = new HashMap<>();
                    setMap.put("id", s.getId());
                    setMap.put("code", s.getCode());
                    setMap.put("title", "Championship Paper - Set " + s.getCode());
                    setMap.put("trainerId", s.getTrainerId());
                    if (s.getTrainerId() != null) {
                        userRepository.findById(s.getTrainerId()).ifPresent(tr -> {
                            setMap.put("trainerName", tr.getName());
                            setMap.put("trainerEmail", tr.getEmail());
                        });
                    }
                    assignedSetMap = setMap;
                }
            }
        }
        response.put("assignedSet", assignedSetMap);

        if (finalAsmt == null) {
            response.put("hasFinalAssessment", false);
            return response;
        }

        response.put("hasFinalAssessment", true);
        Map<String, Object> item = new HashMap<>();
        item.put("id", finalAsmt.getId());
        item.put("competitionId", finalAsmt.getCompetitionId());
        item.put("type", finalAsmt.getType());
        item.put("sequenceNo", finalAsmt.getSequenceNo());
        item.put("title", finalAsmt.getTitle());
        item.put("durationMinutes", finalAsmt.getDurationMinutes());
        item.put("totalMarks", finalAsmt.getTotalMarks());
        item.put("startAt", finalAsmt.getStartAt());
        item.put("endAt", finalAsmt.getEndAt());
        item.put("status", finalAsmt.getStatus());

        boolean isPublished = "PUBLISHED".equalsIgnoreCase(finalAsmt.getStatus());
        long questionCount = questionRepository.countByAssessmentId(finalAsmt.getId());
        item.put("questionCount", questionCount);

        // Window status
        String windowStatus = "UPCOMING";
        long secondsToStart = 0;
        long secondsToEnd = 0;

        if (finalAsmt.getStartAt() != null && finalAsmt.getEndAt() != null) {
            if (now.isBefore(finalAsmt.getStartAt())) {
                windowStatus = "UPCOMING";
                secondsToStart = java.time.Duration.between(now, finalAsmt.getStartAt()).getSeconds();
            } else if (now.isAfter(finalAsmt.getEndAt())) {
                windowStatus = "EXPIRED";
            } else {
                windowStatus = "LIVE";
                secondsToEnd = java.time.Duration.between(now, finalAsmt.getEndAt()).getSeconds();
            }
        } else {
            windowStatus = isPublished ? "LIVE" : "DRAFT";
        }
        item.put("windowStatus", windowStatus);
        item.put("secondsToStart", secondsToStart);
        item.put("secondsToEnd", secondsToEnd);

        String regId = reg != null ? reg.getId() : (user != null ? "reg_admin_" + user.getId() : null);
        if (!isPublished) {
            item.put("attemptStatus", "UNPUBLISHED");
        } else if (regId != null && assessmentAttemptRepository != null) {
            Optional<AssessmentAttempt> attOpt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(finalAsmt.getId(), regId);
            if (attOpt.isEmpty()) {
                if ("UPCOMING".equals(windowStatus)) {
                    item.put("attemptStatus", "UPCOMING_LOCKED");
                } else if ("EXPIRED".equals(windowStatus)) {
                    item.put("attemptStatus", "MISSED");
                } else {
                    item.put("attemptStatus", "NOT_STARTED");
                }
            } else {
                AssessmentAttempt att = attOpt.get();
                item.put("attemptStatus", att.getStatus());
                item.put("attemptId", att.getId());
                item.put("startedAt", att.getStartedAt());
                item.put("submittedAt", att.getSubmittedAt());
                item.put("mcqMarks", att.getMcqMarks());
                item.put("voiceMarks", att.getVoiceMarks());
                item.put("totalMarksAwarded", att.getTotalMarks());
                item.put("setId", att.getSetId());

                if (attemptAnswerRepository != null) {
                    List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(att.getId());
                    item.put("answeredCount", answers.size());
                    long voiceTotal = answers.stream().filter(ans -> ans.getVoiceFileId() != null && !ans.getVoiceFileId().isBlank()).count();
                    long voiceEvaluated = answers.stream().filter(ans -> "EVALUATED".equalsIgnoreCase(ans.getEvaluationStatus()) && ans.getVoiceFileId() != null).count();
                    item.put("voiceQuestionsCount", voiceTotal);
                    item.put("voiceEvaluatedCount", voiceEvaluated);
                }
            }
        } else {
            item.put("attemptStatus", "UPCOMING".equals(windowStatus) ? "UPCOMING_LOCKED" : "NOT_STARTED");
        }

        response.put("finalAssessment", item);
        return response;
    }

    @Transactional
    public Map<String, Object> startOrResumeTestAttempt(String asmtId, User user) {
        CompetitionAssessment asmt = getAssessmentById(asmtId);
        if (!"PUBLISHED".equalsIgnoreCase(asmt.getStatus())) {
            throw new BadRequestException("Assessment is not published yet");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        if ("MOCK".equalsIgnoreCase(asmt.getType()) || "FINAL".equalsIgnoreCase(asmt.getType())) {
            if (asmt.getStartAt() != null && now.isBefore(asmt.getStartAt())) {
                throw new BadRequestException("This test window is not open yet. Scheduled to open at: " + asmt.getStartAt());
            }
            if (asmt.getEndAt() != null && now.isAfter(asmt.getEndAt())) {
                throw new BadRequestException("This test window has closed. Ended at: " + asmt.getEndAt());
            }
        }

        CompetitionRegistration reg = getStudentPaidRegistration(asmt.getCompetitionId(), user);
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();
        if ("STUDENT".equals(role) && reg == null) {
            throw new ForbiddenException("You must have a paid registration to attempt this test");
        }

        String regId = reg != null ? reg.getId() : "reg_admin_" + user.getId();
        AssessmentAttempt attempt = null;
        if (assessmentAttemptRepository != null) {
            Optional<AssessmentAttempt> existingOpt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(asmtId, regId);
            if (existingOpt.isPresent()) {
                attempt = existingOpt.get();
                if ("COMPLETED".equalsIgnoreCase(attempt.getStatus()) || "EVALUATION_PENDING".equalsIgnoreCase(attempt.getStatus())) {
                    throw new BadRequestException("You have already submitted this assessment");
                }
            } else {
                attempt = new AssessmentAttempt();
                attempt.setId("att_" + UUID.randomUUID());
                attempt.setAssessmentId(asmtId);
                attempt.setRegistrationId(regId);
                if (reg != null) {
                    Optional<CompetitionSetMember> memOpt = setMemberRepository.findByRegistrationId(reg.getId());
                    if (memOpt.isPresent()) {
                        attempt.setSetId(memOpt.get().getSetId());
                    }
                }

                attempt.setStatus("IN_PROGRESS");
                attempt.setStartedAt(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));
                attempt.setMcqMarks(BigDecimal.ZERO);
                attempt.setVoiceMarks(BigDecimal.ZERO);
                attempt.setTotalMarks(BigDecimal.ZERO);
                attempt = assessmentAttemptRepository.save(attempt);
            }
        }

        // Load questions, respecting Set assignment if this is a FINAL assessment
        List<AssessmentQuestion> allQuestions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmtId);
        List<AssessmentQuestion> questions = new ArrayList<>(allQuestions);

        if ("FINAL".equalsIgnoreCase(asmt.getType()) && attempt != null && attempt.getSetId() != null && assessmentSetQuestionRepository != null) {
            List<AssessmentSetQuestion> setQuestions = assessmentSetQuestionRepository.findByAssessmentIdAndSetIdOrderByPositionAsc(asmtId, attempt.getSetId());
            if (!setQuestions.isEmpty()) {
                Map<String, AssessmentQuestion> qMap = allQuestions.stream().collect(Collectors.toMap(AssessmentQuestion::getId, q -> q, (a, b) -> a));
                List<AssessmentQuestion> ordered = new ArrayList<>();
                for (AssessmentSetQuestion sq : setQuestions) {
                    AssessmentQuestion q = qMap.get(sq.getQuestionId());
                    if (q != null) {
                        ordered.add(q);
                    }
                }
                if (!ordered.isEmpty()) {
                    questions = ordered;
                }
            }
        }

        List<Map<String, Object>> sanitizedQuestions = new ArrayList<>();
        for (AssessmentQuestion q : questions) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("assessmentId", q.getAssessmentId());
            qMap.put("sortOrder", q.getSortOrder());
            qMap.put("questionFormat", q.getQuestionFormat());
            qMap.put("questionText", q.getQuestionText());
            qMap.put("mediaRef", q.getMediaRef());
            qMap.put("answerFormat", q.getAnswerFormat());
            qMap.put("guidanceText", q.getGuidanceText());
            qMap.put("maxDurationSeconds", q.getMaxDurationSeconds());
            qMap.put("marks", q.getMarks());
            // Intentionally omit explanation to avoid leakage before submission

            List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
            if ("FINAL".equalsIgnoreCase(asmt.getType()) && attempt != null && attempt.getSetId() != null && assessmentSetOptionRepository != null) {
                List<AssessmentSetOption> setOpts = assessmentSetOptionRepository.findByAssessmentIdAndSetIdAndQuestionIdOrderByPositionAsc(asmtId, attempt.getSetId(), q.getId());
                if (!setOpts.isEmpty()) {
                    Map<UUID, QuestionOption> optMap = options.stream().collect(Collectors.toMap(QuestionOption::getId, o -> o, (a, b) -> a));
                    List<QuestionOption> orderedOpts = new ArrayList<>();
                    for (AssessmentSetOption so : setOpts) {
                        QuestionOption opt = optMap.get(so.getOptionId());
                        if (opt != null) {
                            orderedOpts.add(opt);
                        }
                    }
                    if (!orderedOpts.isEmpty()) {
                        options = orderedOpts;
                    }
                }
            }

            List<Map<String, Object>> sanitizedOptions = new ArrayList<>();
            for (QuestionOption opt : options) {
                Map<String, Object> optMap = new HashMap<>();
                optMap.put("id", opt.getId());
                optMap.put("text", opt.getText());
                optMap.put("sortOrder", opt.getSortOrder());
                // Intentionally omit isCorrect to avoid answer leakage
                sanitizedOptions.add(optMap);
            }
            qMap.put("options", sanitizedOptions);
            sanitizedQuestions.add(qMap);
        }

        // Load student's saved answers
        Map<String, Object> savedAnswersMap = new HashMap<>();
        if (attempt != null && attemptAnswerRepository != null) {
            List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attempt.getId());
            for (AttemptAnswer ans : answers) {
                Map<String, Object> aMap = new HashMap<>();
                aMap.put("id", ans.getId());
                aMap.put("questionId", ans.getQuestionId());
                aMap.put("selectedOptionId", ans.getSelectedOptionId());
                aMap.put("voiceFileId", ans.getVoiceFileId());
                aMap.put("voiceDurationSec", ans.getVoiceDurationSec());
                aMap.put("savedAt", ans.getSavedAt());
                savedAnswersMap.put(ans.getQuestionId(), aMap);
            }
        }

        long remainingSeconds = 0;
        if (asmt.getDurationMinutes() != null && asmt.getDurationMinutes() > 0) {
            long totalTestSeconds = asmt.getDurationMinutes() * 60L;
            if (attempt != null && attempt.getStartedAt() != null) {
                long elapsedSeconds = Math.max(0, java.time.Duration.between(attempt.getStartedAt(), now).getSeconds());
                remainingSeconds = Math.max(0, totalTestSeconds - elapsedSeconds);
            } else {
                remainingSeconds = totalTestSeconds;
            }
            if (asmt.getEndAt() != null) {
                long windowRemainingSeconds = Math.max(0, java.time.Duration.between(now, asmt.getEndAt()).getSeconds());
                remainingSeconds = Math.min(remainingSeconds, windowRemainingSeconds);
            }
        }

        Map<String, Object> assignedSetMap = null;
        if (attempt != null && attempt.getSetId() != null) {
            Optional<CompetitionSet> sOpt = setRepository.findById(attempt.getSetId());
            if (sOpt.isPresent()) {
                CompetitionSet s = sOpt.get();
                assignedSetMap = new HashMap<>();
                assignedSetMap.put("id", s.getId());
                assignedSetMap.put("code", s.getCode());
                assignedSetMap.put("title", "Set " + s.getCode());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("attempt", attempt);
        result.put("assessment", asmt);
        result.put("assignedSet", assignedSetMap);
        result.put("questions", sanitizedQuestions);
        result.put("answers", savedAnswersMap);
        result.put("remainingSeconds", remainingSeconds);
        result.put("durationMinutes", asmt.getDurationMinutes());
        result.put("serverNow", now);
        return result;
    }

    @Transactional
    public Map<String, Object> generateSetPapers(String asmtId, User user) {
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();
        if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only an administrator can generate set question papers");
        }

        CompetitionAssessment asmt = getAssessmentById(asmtId);
        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(asmt.getCompetitionId());
        if (sets.isEmpty()) {
            throw new BadRequestException("No competition sets configured for this competition");
        }

        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmtId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Assessment has no questions to distribute across sets");
        }

        // Clean previous
        if (assessmentSetQuestionRepository != null) {
            assessmentSetQuestionRepository.deleteByAssessmentId(asmtId);
        }
        if (assessmentSetOptionRepository != null) {
            assessmentSetOptionRepository.deleteByAssessmentId(asmtId);
        }

        int totalSetQuestions = 0;
        int totalSetOptions = 0;

        for (int sIdx = 0; sIdx < sets.size(); sIdx++) {
            CompetitionSet set = sets.get(sIdx);
            List<AssessmentQuestion> setQuestions = new ArrayList<>(questions);
            long seed = (long) set.getCode().hashCode() * 31L + (sIdx + 1) * 17L;
            Collections.shuffle(setQuestions, new Random(seed));

            for (int pos = 0; pos < setQuestions.size(); pos++) {
                AssessmentQuestion q = setQuestions.get(pos);
                AssessmentSetQuestion asq = new AssessmentSetQuestion(
                        "asq_" + UUID.randomUUID(),
                        asmtId,
                        set.getId(),
                        q.getId(),
                        pos
                );
                if (assessmentSetQuestionRepository != null) {
                    assessmentSetQuestionRepository.save(asq);
                    totalSetQuestions++;
                }

                if ("MCQ_OPTIONS".equalsIgnoreCase(q.getAnswerFormat())) {
                    List<QuestionOption> options = new ArrayList<>(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId()));
                    if (!options.isEmpty()) {
                        long optSeed = seed + pos * 13L;
                        Collections.shuffle(options, new Random(optSeed));
                        for (int oPos = 0; oPos < options.size(); oPos++) {
                            QuestionOption opt = options.get(oPos);
                            AssessmentSetOption aso = new AssessmentSetOption(
                                    "aso_" + UUID.randomUUID(),
                                    asmtId,
                                    set.getId(),
                                    q.getId(),
                                    opt.getId(),
                                    oPos
                            );
                            if (assessmentSetOptionRepository != null) {
                                assessmentSetOptionRepository.save(aso);
                                totalSetOptions++;
                            }
                        }
                    }
                }
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("assessmentId", asmtId);
        res.put("setsCount", sets.size());
        res.put("totalQuestionsPerSet", questions.size());
        res.put("totalSetQuestionsSaved", totalSetQuestions);
        res.put("totalSetOptionsSaved", totalSetOptions);
        return res;
    }

    @Transactional
    public Map<String, Object> saveAttemptAnswer(String asmtId, Map<String, Object> payload, User user) {
        CompetitionAssessment asmt = getAssessmentById(asmtId);
        CompetitionRegistration reg = getStudentPaidRegistration(asmt.getCompetitionId(), user);
        String regId = reg != null ? reg.getId() : "reg_admin_" + user.getId();

        AssessmentAttempt attempt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(asmtId, regId)
                .orElseThrow(() -> new BadRequestException("No active attempt found for this assessment"));

        if (!"IN_PROGRESS".equalsIgnoreCase(attempt.getStatus())) {
            throw new BadRequestException("Attempt is not in progress (status: " + attempt.getStatus() + ")");
        }

        String questionId = (String) payload.get("questionId");
        if (questionId == null || questionId.isBlank()) {
            throw new BadRequestException("Question ID is required");
        }
        AssessmentQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (!asmtId.equals(question.getAssessmentId())) {
            throw new BadRequestException("Question does not belong to this assessment");
        }

        AttemptAnswer answer = attemptAnswerRepository.findByAttemptIdAndQuestionId(attempt.getId(), questionId)
                .orElse(new AttemptAnswer());
        if (answer.getId() == null) {
            answer.setId("ans_" + UUID.randomUUID());
            answer.setAttemptId(attempt.getId());
            answer.setQuestionId(questionId);
        }

        if (payload.containsKey("selectedOptionId")) {
            Object sel = payload.get("selectedOptionId");
            if (sel == null || sel.toString().isBlank()) {
                answer.setSelectedOptionId(null);
            } else {
                try {
                    answer.setSelectedOptionId(UUID.fromString(sel.toString()));
                } catch (Exception e) {
                    throw new BadRequestException("Invalid option ID format");
                }
            }
        }

        if (payload.containsKey("voiceFileId")) {
            answer.setVoiceFileId((String) payload.get("voiceFileId"));
        }

        if (payload.containsKey("voiceDurationSec")) {
            Object dur = payload.get("voiceDurationSec");
            answer.setVoiceDurationSec(dur != null ? ((Number) dur).intValue() : null);
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        answer.setSavedAt(now);

        if ("VOICE".equalsIgnoreCase(question.getAnswerFormat())) {
            answer.setEvaluationStatus("PENDING_TRAINER");
        } else {
            answer.setEvaluationStatus("AUTO");
        }

        AttemptAnswer savedAns = attemptAnswerRepository.save(answer);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("answerId", savedAns.getId());
        res.put("questionId", questionId);
        res.put("savedAt", savedAns.getSavedAt());
        res.put("serverNow", now);
        return res;
    }

    @Transactional
    public Map<String, Object> submitTestAttempt(String asmtId, User user) {
        CompetitionAssessment asmt = getAssessmentById(asmtId);
        CompetitionRegistration reg = getStudentPaidRegistration(asmt.getCompetitionId(), user);
        String regId = reg != null ? reg.getId() : "reg_admin_" + user.getId();

        AssessmentAttempt attempt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(asmtId, regId)
                .orElseThrow(() -> new BadRequestException("No active attempt found for this assessment"));

        if (!"IN_PROGRESS".equalsIgnoreCase(attempt.getStatus())) {
            throw new BadRequestException("Attempt is not in progress (status: " + attempt.getStatus() + ")");
        }

        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmtId);
        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attempt.getId());
        Map<String, AttemptAnswer> answerMap = answers.stream()
                .collect(Collectors.toMap(AttemptAnswer::getQuestionId, a -> a, (a, b) -> a));

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        BigDecimal totalMcqMarks = BigDecimal.ZERO;
        boolean hasVoiceQuestionsWithUpload = false;

        for (AssessmentQuestion q : questions) {
            AttemptAnswer ans = answerMap.get(q.getId());
            if ("MCQ_OPTIONS".equalsIgnoreCase(q.getAnswerFormat())) {
                List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
                Optional<QuestionOption> correctOpt = options.stream().filter(o -> Boolean.TRUE.equals(o.getIsCorrect())).findFirst();

                boolean isCorrect = false;
                if (ans != null && ans.getSelectedOptionId() != null && correctOpt.isPresent()) {
                    if (ans.getSelectedOptionId().equals(correctOpt.get().getId())) {
                        isCorrect = true;
                    }
                }

                if (ans == null) {
                    ans = new AttemptAnswer();
                    ans.setId("ans_" + UUID.randomUUID());
                    ans.setAttemptId(attempt.getId());
                    ans.setQuestionId(q.getId());
                    ans.setSavedAt(now);
                }

                ans.setIsCorrect(isCorrect);
                ans.setEvaluationStatus("EVALUATED");
                ans.setEvaluatedAt(now);
                int qMarks = (q.getMarks() != null && q.getMarks() > 0) ? q.getMarks() : 1;
                BigDecimal awarded = isCorrect ? BigDecimal.valueOf(qMarks) : BigDecimal.ZERO;
                ans.setMarksAwarded(awarded);
                totalMcqMarks = totalMcqMarks.add(awarded);
                attemptAnswerRepository.save(ans);
            } else if ("VOICE".equalsIgnoreCase(q.getAnswerFormat())) {
                if (ans != null && ans.getVoiceFileId() != null && !ans.getVoiceFileId().isBlank()) {
                    hasVoiceQuestionsWithUpload = true;
                    ans.setEvaluationStatus("PENDING_TRAINER");
                    ans.setMarksAwarded(null);
                    attemptAnswerRepository.save(ans);
                } else if (ans != null) {
                    ans.setEvaluationStatus("SKIPPED");
                    ans.setMarksAwarded(BigDecimal.ZERO);
                    attemptAnswerRepository.save(ans);
                }
            }
        }

        attempt.setSubmittedAt(now);
        attempt.setMcqMarks(totalMcqMarks);
        attempt.setVoiceMarks(BigDecimal.ZERO);
        attempt.setTotalMarks(totalMcqMarks);

        if (hasVoiceQuestionsWithUpload) {
            attempt.setStatus("EVALUATION_PENDING");
        } else {
            attempt.setStatus("COMPLETED");
        }

        AssessmentAttempt savedAttempt = assessmentAttemptRepository.save(attempt);

        Map<String, Object> result = new HashMap<>();
        result.put("attemptId", savedAttempt.getId());
        result.put("status", savedAttempt.getStatus());
        result.put("mcqMarks", savedAttempt.getMcqMarks());
        result.put("totalMarks", savedAttempt.getTotalMarks());
        result.put("submittedAt", savedAttempt.getSubmittedAt());
        result.put("hasVoiceQuestions", hasVoiceQuestionsWithUpload);
        result.put("serverNow", now);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAttemptResults(String asmtId, User user) {
        CompetitionAssessment asmt = getAssessmentById(asmtId);
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();

        AssessmentAttempt attempt = null;
        if ("STUDENT".equals(role)) {
            CompetitionRegistration reg = getStudentPaidRegistration(asmt.getCompetitionId(), user);
            if (reg == null) {
                throw new ForbiddenException("You are not registered for this competition");
            }
            attempt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(asmtId, reg.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("No attempt found for this assessment"));
        } else if ("TRAINER".equals(role)) {
            List<AssessmentAttempt> attempts = assessmentAttemptRepository.findByAssessmentId(asmtId);
            // Verify trainer belongs to attempt set
            List<CompetitionSet> trainerSets = setRepository.findByCompetitionIdOrderByCodeAsc(asmt.getCompetitionId())
                    .stream()
                    .filter(s -> user.getId().equals(s.getTrainerId()))
                    .collect(Collectors.toList());
            Set<String> setIds = trainerSets.stream().map(CompetitionSet::getId).collect(Collectors.toSet());
            attempt = attempts.stream()
                    .filter(a -> a.getSetId() != null && setIds.contains(a.getSetId()))
                    .findFirst()
                    .orElseThrow(() -> new ForbiddenException("Trainer does not have access to this assessment attempt"));
        } else {
            // Admin
            Optional<AssessmentAttempt> adminAtt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(asmtId, "reg_admin_" + user.getId());
            if (adminAtt.isPresent()) {
                attempt = adminAtt.get();
            } else {
                List<AssessmentAttempt> attempts = assessmentAttemptRepository.findByAssessmentId(asmtId);
                if (!attempts.isEmpty()) {
                    attempt = attempts.get(0);
                }
            }
        }

        if (attempt == null) {
            throw new ResourceNotFoundException("Attempt not found");
        }

        if ("IN_PROGRESS".equalsIgnoreCase(attempt.getStatus()) || "NOT_STARTED".equalsIgnoreCase(attempt.getStatus())) {
            throw new BadRequestException("Assessment has not been submitted yet");
        }

        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmtId);
        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attempt.getId());
        Map<String, AttemptAnswer> answerMap = answers.stream()
                .collect(Collectors.toMap(AttemptAnswer::getQuestionId, a -> a, (a, b) -> a));

        List<Map<String, Object>> reviewQuestions = new ArrayList<>();
        int correctCount = 0;
        int incorrectCount = 0;
        int voiceCount = 0;
        int voiceEvaluatedCount = 0;

        for (AssessmentQuestion q : questions) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("assessmentId", q.getAssessmentId());
            qMap.put("sortOrder", q.getSortOrder());
            qMap.put("questionFormat", q.getQuestionFormat());
            qMap.put("questionText", q.getQuestionText());
            qMap.put("mediaRef", q.getMediaRef());
            qMap.put("answerFormat", q.getAnswerFormat());
            qMap.put("guidanceText", q.getGuidanceText());
            qMap.put("marks", q.getMarks());
            qMap.put("explanation", q.getExplanation());

            List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
            qMap.put("options", options);

            AttemptAnswer ans = answerMap.get(q.getId());
            if (ans != null) {
                Map<String, Object> ansMap = new HashMap<>();
                ansMap.put("id", ans.getId());
                ansMap.put("selectedOptionId", ans.getSelectedOptionId());
                ansMap.put("isCorrect", ans.getIsCorrect());
                ansMap.put("marksAwarded", ans.getMarksAwarded());
                ansMap.put("voiceFileId", ans.getVoiceFileId());
                ansMap.put("voiceDurationSec", ans.getVoiceDurationSec());
                ansMap.put("evaluationStatus", ans.getEvaluationStatus());
                ansMap.put("feedback", ans.getFeedback());
                qMap.put("studentAnswer", ansMap);

                if ("MCQ_OPTIONS".equalsIgnoreCase(q.getAnswerFormat())) {
                    if (Boolean.TRUE.equals(ans.getIsCorrect())) {
                        correctCount++;
                    } else {
                        incorrectCount++;
                    }
                } else if ("VOICE".equalsIgnoreCase(q.getAnswerFormat())) {
                    voiceCount++;
                    if ("EVALUATED".equalsIgnoreCase(ans.getEvaluationStatus())) {
                        voiceEvaluatedCount++;
                    }
                }
            } else {
                qMap.put("studentAnswer", null);
                if ("MCQ_OPTIONS".equalsIgnoreCase(q.getAnswerFormat())) {
                    incorrectCount++;
                }
            }

            reviewQuestions.add(qMap);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("attemptId", attempt.getId());
        summary.put("status", attempt.getStatus());
        summary.put("startedAt", attempt.getStartedAt());
        summary.put("submittedAt", attempt.getSubmittedAt());
        summary.put("mcqMarks", attempt.getMcqMarks());
        summary.put("voiceMarks", attempt.getVoiceMarks());
        summary.put("totalMarks", attempt.getTotalMarks());
        summary.put("maxMarks", asmt.getTotalMarks());
        summary.put("totalQuestions", questions.size());
        summary.put("answeredCount", answers.size());
        summary.put("correctCount", correctCount);
        summary.put("incorrectCount", incorrectCount);
        summary.put("voiceCount", voiceCount);
        summary.put("voiceEvaluatedCount", voiceEvaluatedCount);

        Map<String, Object> result = new HashMap<>();
        result.put("assessment", asmt);
        result.put("attempt", summary);
        result.put("questions", reviewQuestions);
        result.put("serverNow", OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));
        return result;
    }

    @Transactional
    public void resetAssessmentAttempt(String asmtId, String attemptId, User user) {
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();
        if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only an admin can reset an assessment attempt");
        }

        AssessmentAttempt att = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        if (attemptAnswerRepository != null) {
            attemptAnswerRepository.deleteByAttemptId(att.getId());
        }
        assessmentAttemptRepository.delete(att);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTrainerPendingSubmissions(String competitionId, User user) {
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();
        if (!"TRAINER".equals(role) && !"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only trainers and admins can access evaluation submissions");
        }

        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(competitionId);
        List<CompetitionSet> targetSets;
        if ("TRAINER".equals(role)) {
            targetSets = sets.stream()
                    .filter(s -> user.getId().equals(s.getTrainerId()))
                    .collect(Collectors.toList());
            if (targetSets.isEmpty()) {
                return Collections.emptyList();
            }
        } else {
            targetSets = sets;
        }

        Set<String> setIds = targetSets.stream().map(CompetitionSet::getId).collect(Collectors.toSet());
        Map<String, CompetitionSet> setMap = targetSets.stream().collect(Collectors.toMap(CompetitionSet::getId, s -> s, (a, b) -> a));

        List<CompetitionAssessment> assessments = assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(competitionId);
        List<Map<String, Object>> resultList = new ArrayList<>();

        for (CompetitionAssessment asmt : assessments) {
            List<AssessmentAttempt> attempts = assessmentAttemptRepository.findByAssessmentId(asmt.getId());
            for (AssessmentAttempt att : attempts) {
                if ("NOT_STARTED".equalsIgnoreCase(att.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(att.getStatus())) {
                    continue;
                }

                String setId = att.getSetId();
                if (setId == null) {
                    Optional<CompetitionSetMember> mem = setMemberRepository.findByRegistrationId(att.getRegistrationId());
                    if (mem.isPresent()) {
                        setId = mem.get().getSetId();
                    }
                }

                if (setId == null || !setIds.contains(setId)) {
                    continue; // Strict set isolation
                }

                CompetitionSet cSet = setMap.get(setId);
                CompetitionRegistration reg = registrationRepository.findById(att.getRegistrationId()).orElse(null);

                List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(att.getId());
                long voiceCount = answers.stream().filter(a -> a.getVoiceFileId() != null && !a.getVoiceFileId().isBlank()).count();
                long voiceEvaluatedCount = answers.stream().filter(a -> "EVALUATED".equalsIgnoreCase(a.getEvaluationStatus()) && a.getVoiceFileId() != null && !a.getVoiceFileId().isBlank()).count();
                long voicePendingCount = answers.stream().filter(a -> "PENDING_TRAINER".equalsIgnoreCase(a.getEvaluationStatus()) && a.getVoiceFileId() != null && !a.getVoiceFileId().isBlank()).count();

                Map<String, Object> item = new HashMap<>();
                item.put("attemptId", att.getId());
                item.put("assessmentId", asmt.getId());
                item.put("assessmentTitle", asmt.getTitle());
                item.put("assessmentType", asmt.getType());
                item.put("sequenceNo", asmt.getSequenceNo());
                item.put("status", att.getStatus());
                item.put("startedAt", att.getStartedAt());
                item.put("submittedAt", att.getSubmittedAt());
                item.put("mcqMarks", att.getMcqMarks());
                item.put("voiceMarks", att.getVoiceMarks());
                item.put("totalMarks", att.getTotalMarks());
                item.put("maxMarks", asmt.getTotalMarks());
                item.put("registrationId", att.getRegistrationId());
                item.put("studentName", reg != null ? reg.getStudentName() : "Student");
                item.put("studentEmail", reg != null ? reg.getStudentEmail() : "");
                item.put("studentPhone", reg != null ? reg.getStudentPhone() : "");
                item.put("setId", setId);
                item.put("setCode", cSet != null ? cSet.getCode() : "");
                item.put("setName", cSet != null ? "Set " + cSet.getCode() : "");
                item.put("voiceQuestionsCount", voiceCount);
                item.put("voiceEvaluatedCount", voiceEvaluatedCount);
                item.put("voicePendingCount", voicePendingCount);

                resultList.add(item);
            }
        }

        resultList.sort((a, b) -> {
            boolean aPending = "EVALUATION_PENDING".equalsIgnoreCase((String) a.get("status"));
            boolean bPending = "EVALUATION_PENDING".equalsIgnoreCase((String) b.get("status"));
            if (aPending && !bPending) return -1;
            if (!aPending && bPending) return 1;
            OffsetDateTime aTime = (OffsetDateTime) a.get("submittedAt");
            OffsetDateTime bTime = (OffsetDateTime) b.get("submittedAt");
            if (aTime != null && bTime != null) {
                return bTime.compareTo(aTime);
            }
            return 0;
        });

        return resultList;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTrainerAttemptDetail(String attemptId, User user) {
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();
        if (!"TRAINER".equals(role) && !"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only trainers and admins can view attempt details");
        }

        AssessmentAttempt att = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));
        CompetitionAssessment asmt = getAssessmentById(att.getAssessmentId());

        String setId = att.getSetId();
        if (setId == null) {
            Optional<CompetitionSetMember> mem = setMemberRepository.findByRegistrationId(att.getRegistrationId());
            if (mem.isPresent()) {
                setId = mem.get().getSetId();
            }
        }

        CompetitionSet set = null;
        if (setId != null) {
            set = setRepository.findById(setId).orElse(null);
        }

        if ("TRAINER".equals(role)) {
            if (set == null || !user.getId().equals(set.getTrainerId())) {
                throw new ForbiddenException("Trainer does not have permission to evaluate this attempt (assigned to Set " + (set != null ? set.getCode() : "unknown") + ")");
            }
        }

        CompetitionRegistration reg = registrationRepository.findById(att.getRegistrationId()).orElse(null);

        List<AssessmentQuestion> allQuestions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmt.getId());
        List<AssessmentQuestion> orderedQuestions = new ArrayList<>(allQuestions);

        if ("FINAL".equalsIgnoreCase(asmt.getType()) && set != null && assessmentSetQuestionRepository != null) {
            List<AssessmentSetQuestion> setQuestions = assessmentSetQuestionRepository.findByAssessmentIdAndSetIdOrderByPositionAsc(asmt.getId(), set.getId());
            if (!setQuestions.isEmpty()) {
                Map<String, AssessmentQuestion> qMap = allQuestions.stream().collect(Collectors.toMap(AssessmentQuestion::getId, q -> q, (a, b) -> a));
                List<AssessmentQuestion> ordered = new ArrayList<>();
                for (AssessmentSetQuestion sq : setQuestions) {
                    AssessmentQuestion q = qMap.get(sq.getQuestionId());
                    if (q != null) ordered.add(q);
                }
                if (!ordered.isEmpty()) {
                    orderedQuestions = ordered;
                }
            }
        }

        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(att.getId());
        Map<String, AttemptAnswer> answerMap = answers.stream().collect(Collectors.toMap(AttemptAnswer::getQuestionId, a -> a, (a, b) -> a));

        List<Map<String, Object>> questionItems = new ArrayList<>();
        for (AssessmentQuestion q : orderedQuestions) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("sortOrder", q.getSortOrder());
            qMap.put("questionFormat", q.getQuestionFormat());
            qMap.put("questionText", q.getQuestionText());
            qMap.put("answerFormat", q.getAnswerFormat());
            qMap.put("guidanceText", q.getGuidanceText());
            qMap.put("marks", q.getMarks());
            qMap.put("explanation", q.getExplanation());

            List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
            qMap.put("options", options);

            if (evaluationCriteriaRepository != null) {
                List<AssessmentEvaluationCriteria> criteria = evaluationCriteriaRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
                qMap.put("criteria", criteria);
            } else {
                qMap.put("criteria", Collections.emptyList());
            }

            AttemptAnswer ans = answerMap.get(q.getId());
            if (ans != null) {
                Map<String, Object> ansMap = new HashMap<>();
                ansMap.put("id", ans.getId());
                ansMap.put("selectedOptionId", ans.getSelectedOptionId());
                ansMap.put("isCorrect", ans.getIsCorrect());
                ansMap.put("voiceFileId", ans.getVoiceFileId());
                ansMap.put("voiceDurationSec", ans.getVoiceDurationSec());
                ansMap.put("marksAwarded", ans.getMarksAwarded());
                ansMap.put("evaluationStatus", ans.getEvaluationStatus());
                ansMap.put("feedback", ans.getFeedback());
                ansMap.put("trainerFeedback", ans.getTrainerFeedback());
                ansMap.put("evaluatedBy", ans.getEvaluatedBy());
                ansMap.put("evaluatedAt", ans.getEvaluatedAt());

                if (ans.getVoiceFileId() != null && !ans.getVoiceFileId().isBlank()) {
                    String audioUrl = null;
                    if (storedFileRepository != null) {
                        Optional<StoredFile> sfOpt = storedFileRepository.findById(ans.getVoiceFileId());
                        if (sfOpt.isPresent()) {
                            try {
                                Map<String, Object> link = fileStorageService.generateFileLink(sfOpt.get(), 7200);
                                audioUrl = (String) link.get("url");
                            } catch (Exception e) {
                                audioUrl = fileStorageService.getFileUrl(sfOpt.get());
                            }
                        }
                    }
                    if (audioUrl == null) {
                        audioUrl = "/api/files/" + ans.getVoiceFileId();
                    }
                    ansMap.put("audioUrl", audioUrl);
                }

                if (voiceEvaluationScoreRepository != null) {
                    List<VoiceEvaluationScore> vScores = voiceEvaluationScoreRepository.findByAnswerId(ans.getId());
                    ansMap.put("criteriaScores", vScores);
                } else {
                    ansMap.put("criteriaScores", Collections.emptyList());
                }

                qMap.put("studentAnswer", ansMap);
            } else {
                qMap.put("studentAnswer", null);
            }

            questionItems.add(qMap);
        }

        Map<String, Object> attemptSummary = new HashMap<>();
        attemptSummary.put("id", att.getId());
        attemptSummary.put("assessmentId", asmt.getId());
        attemptSummary.put("assessmentTitle", asmt.getTitle());
        attemptSummary.put("assessmentType", asmt.getType());
        attemptSummary.put("status", att.getStatus());
        attemptSummary.put("startedAt", att.getStartedAt());
        attemptSummary.put("submittedAt", att.getSubmittedAt());
        attemptSummary.put("mcqMarks", att.getMcqMarks());
        attemptSummary.put("voiceMarks", att.getVoiceMarks());
        attemptSummary.put("totalMarks", att.getTotalMarks());
        attemptSummary.put("maxMarks", asmt.getTotalMarks());
        attemptSummary.put("registrationId", att.getRegistrationId());
        attemptSummary.put("studentName", reg != null ? reg.getStudentName() : "Student");
        attemptSummary.put("studentEmail", reg != null ? reg.getStudentEmail() : "");
        attemptSummary.put("studentPhone", reg != null ? reg.getStudentPhone() : "");
        attemptSummary.put("setId", setId);
        attemptSummary.put("setCode", set != null ? set.getCode() : "");
        attemptSummary.put("setName", set != null ? "Set " + set.getCode() : "");

        Map<String, Object> response = new HashMap<>();
        response.put("attempt", attemptSummary);
        response.put("assessment", asmt);
        response.put("questions", questionItems);
        response.put("serverNow", OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));
        return response;
    }

    @Transactional
    public Map<String, Object> evaluateVoiceAnswer(String attemptId, String answerId, Map<String, Object> payload, User user) {
        String role = (user.getRole() != null ? user.getRole() : "").toUpperCase();
        if (!"TRAINER".equals(role) && !"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only trainers and admins can evaluate answers");
        }

        AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));

        String setId = attempt.getSetId();
        if (setId == null) {
            Optional<CompetitionSetMember> mem = setMemberRepository.findByRegistrationId(attempt.getRegistrationId());
            if (mem.isPresent()) {
                setId = mem.get().getSetId();
                attempt.setSetId(setId);
                assessmentAttemptRepository.save(attempt);
            }
        }

        CompetitionSet set = null;
        if (setId != null) {
            set = setRepository.findById(setId).orElse(null);
        }

        if ("TRAINER".equals(role)) {
            if (set == null || !user.getId().equals(set.getTrainerId())) {
                throw new ForbiddenException("Trainer does not have permission to evaluate attempts for Set " + (set != null ? set.getCode() : "unknown"));
            }
        }

        AttemptAnswer answer = attemptAnswerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found with id: " + answerId));

        if (!attempt.getId().equals(answer.getAttemptId())) {
            throw new BadRequestException("Answer does not belong to attempt: " + attemptId);
        }

        AssessmentQuestion question = questionRepository.findById(answer.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + answer.getQuestionId()));

        Object marksObj = payload.get("marksAwarded");
        if (marksObj == null) {
            throw new BadRequestException("marksAwarded is required");
        }
        BigDecimal marksAwarded = new BigDecimal(marksObj.toString());
        BigDecimal maxMarks = BigDecimal.valueOf(question.getMarks() != null && question.getMarks() > 0 ? question.getMarks() : 10);
        if (marksAwarded.compareTo(BigDecimal.ZERO) < 0 || marksAwarded.compareTo(maxMarks) > 0) {
            throw new BadRequestException("Marks awarded must be between 0 and " + maxMarks);
        }

        String feedback = (String) payload.getOrDefault("feedback", "");
        answer.setMarksAwarded(marksAwarded);
        answer.setFeedback(feedback);
        answer.setTrainerFeedback(feedback);
        answer.setEvaluationStatus("EVALUATED");
        answer.setEvaluatedBy(user.getId());
        answer.setEvaluatorId(user.getId());
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        answer.setEvaluatedAt(now);
        attemptAnswerRepository.save(answer);

        if (voiceEvaluationScoreRepository != null && payload.get("criteriaScores") instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> cMap) {
                    String criterionId = (String) cMap.get("criterionId");
                    Object cScoreObj = cMap.get("score");
                    if (criterionId != null && cScoreObj != null) {
                        BigDecimal cScore = new BigDecimal(cScoreObj.toString());
                        Optional<VoiceEvaluationScore> existingScore = voiceEvaluationScoreRepository.findByAnswerIdAndCriterionId(answer.getId(), criterionId);
                        VoiceEvaluationScore ves = existingScore.orElseGet(() -> {
                            VoiceEvaluationScore s = new VoiceEvaluationScore();
                            s.setId("ves_" + UUID.randomUUID());
                            s.setAnswerId(answer.getId());
                            s.setCriterionId(criterionId);
                            return s;
                        });
                        ves.setScore(cScore);
                        voiceEvaluationScoreRepository.save(ves);
                    }
                }
            }
        }

        List<AttemptAnswer> allAnswers = attemptAnswerRepository.findByAttemptId(attempt.getId());
        List<AssessmentQuestion> allQuestions = questionRepository.findByAssessmentIdOrderBySortOrderAsc(attempt.getAssessmentId());
        Map<String, AssessmentQuestion> qMap = allQuestions.stream().collect(Collectors.toMap(AssessmentQuestion::getId, q -> q, (a, b) -> a));

        BigDecimal totalVoiceMarks = BigDecimal.ZERO;
        boolean anyVoicePending = false;

        for (AttemptAnswer ans : allAnswers) {
            AssessmentQuestion q = qMap.get(ans.getQuestionId());
            boolean isVoice = (q != null && "VOICE".equalsIgnoreCase(q.getAnswerFormat())) || (ans.getVoiceFileId() != null && !ans.getVoiceFileId().isBlank());
            if (isVoice) {
                if (ans.getMarksAwarded() != null) {
                    totalVoiceMarks = totalVoiceMarks.add(ans.getMarksAwarded());
                }
                if ("PENDING_TRAINER".equalsIgnoreCase(ans.getEvaluationStatus())) {
                    anyVoicePending = true;
                }
            }
        }

        attempt.setVoiceMarks(totalVoiceMarks);
        BigDecimal mcqMarks = attempt.getMcqMarks() != null ? attempt.getMcqMarks() : BigDecimal.ZERO;
        attempt.setTotalMarks(mcqMarks.add(totalVoiceMarks));

        if (!anyVoicePending) {
            attempt.setStatus("COMPLETED");
        }
        AssessmentAttempt savedAttempt = assessmentAttemptRepository.save(attempt);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("attemptId", savedAttempt.getId());
        resp.put("status", savedAttempt.getStatus());
        resp.put("mcqMarks", savedAttempt.getMcqMarks());
        resp.put("voiceMarks", savedAttempt.getVoiceMarks());
        resp.put("totalMarks", savedAttempt.getTotalMarks());
        resp.put("evaluatedAnswerId", answer.getId());
        resp.put("marksAwarded", answer.getMarksAwarded());
        resp.put("feedback", answer.getFeedback());
        resp.put("serverNow", now);
        return resp;
    }

    // =========================================================================
    // PHASE 5: LEADERBOARD ENGINE
    // =========================================================================

    @Transactional
    public Map<String, Object> recalculateLeaderboard(String competitionId, User currentUser) {
        Competition comp = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found: " + competitionId));

        // 1. Fetch all registrations for this competition
        List<CompetitionRegistration> registrations = registrationRepository.findByCompetitionId(competitionId);
        if (registrations == null) registrations = new ArrayList<>();

        // 2. Map set assignments
        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(competitionId);
        Map<String, String> setIdToCodeMap = new HashMap<>();
        for (CompetitionSet s : sets) {
            setIdToCodeMap.put(s.getId(), s.getCode());
        }

        List<CompetitionSetMember> members = setMemberRepository.findByCompetitionId(competitionId);
        Map<String, String> regSetCodeMap = new HashMap<>();
        for (CompetitionSetMember m : members) {
            String code = setIdToCodeMap.getOrDefault(m.getSetId(), "A");
            regSetCodeMap.put(m.getRegistrationId(), code);
        }

        // 3. Find the championship final assessment for this competition
        List<CompetitionAssessment> assessments = assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(competitionId);
        CompetitionAssessment finalAsmt = assessments.stream()
                .filter(a -> "FINAL".equalsIgnoreCase(a.getType()))
                .findFirst().orElse(null);

        // Helper class to hold student scoring row
        class StudentScoreRow {
            CompetitionRegistration reg;
            String setCode;
            BigDecimal totalMarks;
            OffsetDateTime submittedAt;
        }

        List<StudentScoreRow> rows = new ArrayList<>();
        for (CompetitionRegistration reg : registrations) {
            StudentScoreRow row = new StudentScoreRow();
            row.reg = reg;
            row.setCode = regSetCodeMap.getOrDefault(reg.getId(), "A");
            row.totalMarks = BigDecimal.ZERO;
            row.submittedAt = null;

            if (finalAsmt != null && assessmentAttemptRepository != null) {
                Optional<AssessmentAttempt> opt = assessmentAttemptRepository.findByAssessmentIdAndRegistrationId(finalAsmt.getId(), reg.getId());
                if (opt.isPresent()) {
                    AssessmentAttempt att = opt.get();
                    if (att.getTotalMarks() != null) {
                        row.totalMarks = att.getTotalMarks();
                    }
                    row.submittedAt = att.getSubmittedAt() != null ? att.getSubmittedAt() : att.getStartedAt();
                }
            }

            // Fallback: If no final attempt or final attempt totalMarks is 0, check other attempts in the competition
            if (row.totalMarks.compareTo(BigDecimal.ZERO) == 0 && assessmentAttemptRepository != null) {
                List<AssessmentAttempt> otherAttempts = assessmentAttemptRepository.findByRegistrationId(reg.getId());
                BigDecimal sumMarks = BigDecimal.ZERO;
                OffsetDateTime latestSubmit = null;
                for (AssessmentAttempt att : otherAttempts) {
                    if (att.getTotalMarks() != null && att.getTotalMarks().compareTo(BigDecimal.ZERO) > 0) {
                        sumMarks = sumMarks.add(att.getTotalMarks());
                        if (att.getSubmittedAt() != null && (latestSubmit == null || att.getSubmittedAt().isAfter(latestSubmit))) {
                            latestSubmit = att.getSubmittedAt();
                        }
                    }
                }
                if (sumMarks.compareTo(BigDecimal.ZERO) > 0) {
                    row.totalMarks = sumMarks;
                    row.submittedAt = latestSubmit;
                } else if (reg.getScore() != null && reg.getScore().compareTo(BigDecimal.ZERO) > 0) {
                    row.totalMarks = reg.getScore();
                }
            }
            rows.add(row);
        }

        // 4. Sort entries:
        //    Primary: totalMarks DESC
        //    Secondary: submittedAt ASC (nulls last)
        //    Tertiary: studentName ASC
        rows.sort((a, b) -> {
            int cmp = b.totalMarks.compareTo(a.totalMarks);
            if (cmp != 0) return cmp;
            if (a.submittedAt != null && b.submittedAt != null) {
                int timeCmp = a.submittedAt.compareTo(b.submittedAt);
                if (timeCmp != 0) return timeCmp;
            } else if (a.submittedAt != null && b.submittedAt == null) {
                return -1;
            } else if (a.submittedAt == null && b.submittedAt != null) {
                return 1;
            }
            String nameA = a.reg.getStudentName() != null ? a.reg.getStudentName() : "";
            String nameB = b.reg.getStudentName() != null ? b.reg.getStudentName() : "";
            return nameA.compareToIgnoreCase(nameB);
        });

        // 5. Calculate Ranks and Percentiles
        int totalStudents = rows.size();
        ZoneId ist = ZoneId.of("Asia/Kolkata");
        OffsetDateTime now = OffsetDateTime.now(ist);

        List<CompetitionLeaderboardCache> cacheList = new ArrayList<>();
        List<LeaderboardEntry> entryList = new ArrayList<>();

        int currentRank = 1;
        for (int i = 0; i < totalStudents; i++) {
            StudentScoreRow r = rows.get(i);
            if (i > 0) {
                StudentScoreRow prev = rows.get(i - 1);
                boolean sameMarks = r.totalMarks.compareTo(prev.totalMarks) == 0;
                boolean sameTime = (r.submittedAt == null && prev.submittedAt == null) ||
                        (r.submittedAt != null && prev.submittedAt != null && r.submittedAt.isEqual(prev.submittedAt));
                if (!sameMarks || !sameTime) {
                    currentRank = i + 1;
                }
            } else {
                currentRank = 1;
            }

            // Percentile formula: ((totalStudents - rank) / (totalStudents - 1)) * 100
            BigDecimal percentile = BigDecimal.valueOf(100.00);
            if (totalStudents > 1) {
                double pct = ((double)(totalStudents - currentRank) / (double)(totalStudents - 1)) * 100.0;
                percentile = BigDecimal.valueOf(Math.max(0.0, Math.min(100.0, pct))).setScale(2, RoundingMode.HALF_UP);
            }

            CompetitionLeaderboardCache cache = null;
            if (leaderboardCacheRepository != null) {
                cache = leaderboardCacheRepository.findByCompetitionIdAndRegistrationId(competitionId, r.reg.getId()).orElse(null);
            }
            if (cache == null) {
                cache = new CompetitionLeaderboardCache();
                cache.setId("lbc_" + UUID.randomUUID().toString().substring(0, 16));
                cache.setCompetitionId(competitionId);
                cache.setRegistrationId(r.reg.getId());
            }
            cache.setStudentName(r.reg.getStudentName() != null ? r.reg.getStudentName() : "Student");
            cache.setSetCode(r.setCode);
            cache.setTotalMarks(r.totalMarks);
            cache.setRank(currentRank);
            cache.setPercentile(percentile);
            cache.setPublishedAt("PUBLISHED".equalsIgnoreCase(comp.getLeaderboardStatus()) ? now : null);
            cache.setLastRefreshedAt(now);
            cacheList.add(cache);

            LeaderboardEntry entry = null;
            if (leaderboardEntryRepository != null) {
                entry = leaderboardEntryRepository.findByCompetitionIdAndRegistrationId(competitionId, r.reg.getId()).orElse(null);
            }
            if (entry == null) {
                entry = new LeaderboardEntry();
                entry.setId("lbe_" + UUID.randomUUID().toString().substring(0, 16));
                entry.setCompetitionId(competitionId);
                entry.setRegistrationId(r.reg.getId());
            }
            entry.setStudentName(r.reg.getStudentName() != null ? r.reg.getStudentName() : "Student");
            entry.setSetCode(r.setCode);
            entry.setTotalMarks(r.totalMarks);
            entry.setRank(currentRank);
            entry.setPercentile(percentile);
            entry.setFinalSubmittedAt(r.submittedAt);
            entry.setPublishedAt(now);
            entryList.add(entry);

            // Sync rank and score to CompetitionRegistration
            r.reg.setRank(currentRank);
            r.reg.setScore(r.totalMarks);
            registrationRepository.save(r.reg);
        }

        if (leaderboardCacheRepository != null) {
            leaderboardCacheRepository.saveAll(cacheList);
        }
        if (leaderboardEntryRepository != null) {
            leaderboardEntryRepository.saveAll(entryList);
        }

        return getLeaderboard(competitionId, currentUser);
    }

    public Map<String, Object> getLeaderboard(String competitionId, User currentUser) {
        Competition comp = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found: " + competitionId));

        List<CompetitionLeaderboardCache> cached = leaderboardCacheRepository != null
                ? leaderboardCacheRepository.findByCompetitionIdOrderByRankAsc(competitionId)
                : Collections.emptyList();

        if (cached == null || cached.isEmpty()) {
            return recalculateLeaderboard(competitionId, currentUser);
        }

        String userRole = currentUser != null && currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "PUBLIC";
        boolean isStaff = "ADMIN".equals(userRole) || "SUPER_ADMIN".equals(userRole) || "TRAINER".equals(userRole);
        boolean isPublished = "PUBLISHED".equalsIgnoreCase(comp.getLeaderboardStatus());

        ZoneId ist = ZoneId.of("Asia/Kolkata");
        OffsetDateTime now = OffsetDateTime.now(ist);

        // Check if scheduled publish time has arrived for SCHEDULED status
        if (!isPublished && "SCHEDULED".equalsIgnoreCase(comp.getLeaderboardStatus())
                && comp.getLeaderboardPublishedAt() != null && now.isAfter(comp.getLeaderboardPublishedAt())) {
            comp.setLeaderboardStatus("PUBLISHED");
            competitionRepository.save(comp);
            isPublished = true;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("competitionId", comp.getId());
        result.put("competitionTitle", comp.getTitle());
        result.put("status", comp.getLeaderboardStatus() != null ? comp.getLeaderboardStatus() : "NOT_PUBLISHED");
        result.put("isPublished", isPublished);
        result.put("publishedAt", comp.getLeaderboardPublishedAt());
        result.put("scheduledPublishTime", comp.getLeaderboardPublishTime());
        result.put("answerReviewEnabled", Boolean.TRUE.equals(comp.getAnswerReviewEnabled()));
        result.put("totalParticipants", cached.size());
        result.put("serverNow", now);

        // If not published and not staff, return unpublished metadata with countdown
        if (!isPublished && !isStaff) {
            result.put("entries", Collections.emptyList());
            result.put("podium", Collections.emptyList());
            result.put("myRank", null);
            result.put("setStats", Collections.emptyMap());
            return result;
        }

        // Format entries and partition by set
        List<Map<String, Object>> entriesList = new ArrayList<>();
        Map<String, List<Map<String, Object>>> setEntriesMap = new HashMap<>();
        setEntriesMap.put("A", new ArrayList<>());
        setEntriesMap.put("B", new ArrayList<>());
        setEntriesMap.put("C", new ArrayList<>());
        setEntriesMap.put("D", new ArrayList<>());

        Map<String, Object> myRankObj = null;
        String currentStudentEmail = currentUser != null ? currentUser.getEmail() : null;
        String currentStudentId = currentUser != null ? currentUser.getId() : null;

        for (CompetitionLeaderboardCache c : cached) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("rank", c.getRank());
            item.put("registrationId", c.getRegistrationId());
            item.put("studentName", c.getStudentName());
            item.put("setCode", c.getSetCode());
            item.put("totalMarks", c.getTotalMarks());
            item.put("percentile", c.getPercentile());

            entriesList.add(item);
            String setKey = c.getSetCode() != null ? c.getSetCode().toUpperCase() : "A";
            setEntriesMap.computeIfAbsent(setKey, k -> new ArrayList<>()).add(item);

            // Match myRank if student
            if (currentUser != null && myRankObj == null) {
                Optional<CompetitionRegistration> regOpt = registrationRepository.findById(c.getRegistrationId());
                if (regOpt.isPresent()) {
                    CompetitionRegistration r = regOpt.get();
                    if ((currentStudentId != null && currentStudentId.equals(r.getStudentId())) ||
                        (currentStudentEmail != null && currentStudentEmail.equalsIgnoreCase(r.getStudentEmail()))) {
                        myRankObj = new HashMap<>(item);
                    }
                }
            }
        }

        // Calculate setRank within each set
        for (Map.Entry<String, List<Map<String, Object>>> entry : setEntriesMap.entrySet()) {
            List<Map<String, Object>> list = entry.getValue();
            for (int i = 0; i < list.size(); i++) {
                list.get(i).put("setRank", i + 1);
            }
        }

        // Attach setRank to myRankObj
        if (myRankObj != null) {
            String mySet = (String) myRankObj.get("setCode");
            List<Map<String, Object>> setList = setEntriesMap.getOrDefault(mySet != null ? mySet.toUpperCase() : "A", Collections.emptyList());
            for (Map<String, Object> sItem : setList) {
                if (myRankObj.get("registrationId").equals(sItem.get("registrationId"))) {
                    myRankObj.put("setRank", sItem.get("setRank"));
                    break;
                }
            }
        }

        result.put("entries", entriesList);
        result.put("myRank", myRankObj);

        // Podium: Top 3
        List<Map<String, Object>> podium = new ArrayList<>();
        for (int i = 0; i < Math.min(3, entriesList.size()); i++) {
            podium.add(entriesList.get(i));
        }
        result.put("podium", podium);

        // Set counts & summary stats
        Map<String, Object> setStats = new HashMap<>();
        for (String sCode : Arrays.asList("A", "B", "C", "D")) {
            List<Map<String, Object>> sList = setEntriesMap.getOrDefault(sCode, Collections.emptyList());
            Map<String, Object> st = new HashMap<>();
            st.put("count", sList.size());
            BigDecimal topScore = sList.isEmpty() ? BigDecimal.ZERO : (BigDecimal) sList.get(0).get("totalMarks");
            st.put("topScore", topScore);
            setStats.put(sCode, st);
        }
        result.put("setStats", setStats);

        return result;
    }

    @Transactional
    public Map<String, Object> publishLeaderboard(String competitionId, User currentUser) {
        String role = currentUser != null && currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "";
        if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only administrators can publish the leaderboard");
        }

        Competition comp = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found: " + competitionId));

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        comp.setLeaderboardStatus("PUBLISHED");
        comp.setLeaderboardPublishedAt(now);
        competitionRepository.save(comp);

        if (leaderboardCacheRepository != null) {
            List<CompetitionLeaderboardCache> cached = leaderboardCacheRepository.findByCompetitionIdOrderByRankAsc(competitionId);
            for (CompetitionLeaderboardCache c : cached) {
                c.setPublishedAt(now);
            }
            leaderboardCacheRepository.saveAll(cached);
        }

        return getLeaderboard(competitionId, currentUser);
    }

    @Transactional
    public Map<String, Object> unpublishLeaderboard(String competitionId, User currentUser) {
        String role = currentUser != null && currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "";
        if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only administrators can unpublish the leaderboard");
        }

        Competition comp = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found: " + competitionId));

        comp.setLeaderboardStatus("NOT_PUBLISHED");
        comp.setLeaderboardPublishedAt(null);
        competitionRepository.save(comp);

        if (leaderboardCacheRepository != null) {
            List<CompetitionLeaderboardCache> cached = leaderboardCacheRepository.findByCompetitionIdOrderByRankAsc(competitionId);
            for (CompetitionLeaderboardCache c : cached) {
                c.setPublishedAt(null);
            }
            leaderboardCacheRepository.saveAll(cached);
        }

        return getLeaderboard(competitionId, currentUser);
    }

    @Transactional
    public Map<String, Object> toggleAnswerReview(String competitionId, User currentUser) {
        String role = currentUser != null && currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "";
        if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("Only administrators can toggle answer review");
        }

        Competition comp = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found: " + competitionId));

        boolean current = Boolean.TRUE.equals(comp.getAnswerReviewEnabled());
        comp.setAnswerReviewEnabled(!current);
        competitionRepository.save(comp);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("answerReviewEnabled", comp.getAnswerReviewEnabled());
        return res;
    }
}

