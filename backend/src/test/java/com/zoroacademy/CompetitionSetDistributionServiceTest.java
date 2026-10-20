package com.zoroacademy;

import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionSet;
import com.zoroacademy.entity.CompetitionSetMember;
import com.zoroacademy.repository.CompetitionRepository;
import com.zoroacademy.repository.CompetitionSetMemberRepository;
import com.zoroacademy.repository.CompetitionSetRepository;
import com.zoroacademy.service.CompetitionSetDistributionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class CompetitionSetDistributionServiceTest {

    @Autowired
    private CompetitionSetDistributionService distributionService;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private CompetitionSetRepository setRepository;

    @Autowired
    private CompetitionSetMemberRepository memberRepository;

    private Competition comp1;
    private Competition comp2;

    @BeforeEach
    void setUp() {
        comp1 = new Competition();
        comp1.setId("comp_test_dist_1_" + UUID.randomUUID());
        comp1.setTitle("Distribution Test Competition 1");
        competitionRepository.save(comp1);

        comp2 = new Competition();
        comp2.setId("comp_test_dist_2_" + UUID.randomUUID());
        comp2.setTitle("Distribution Test Competition 2");
        competitionRepository.save(comp2);
    }

    @AfterEach
    void tearDown() {
        if (comp1 != null) {
            memberRepository.deleteByCompetitionId(comp1.getId());
            setRepository.deleteByCompetitionId(comp1.getId());
            competitionRepository.delete(comp1);
        }
        if (comp2 != null) {
            memberRepository.deleteByCompetitionId(comp2.getId());
            setRepository.deleteByCompetitionId(comp2.getId());
            competitionRepository.delete(comp2);
        }
    }

    @Test
    @DisplayName("320 registrations -> exact 80/80/80/80 distribution across Sets A, B, C, D")
    void test320RegistrationsExactDistribution() {
        for (int i = 1; i <= 320; i++) {
            distributionService.assignStudentToSet(comp1.getId(), "reg_320_" + i);
        }

        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(comp1.getId());
        assertEquals(4, sets.size());

        for (CompetitionSet s : sets) {
            long count = memberRepository.countBySetId(s.getId());
            assertEquals(80, count, "Set " + s.getCode() + " must have exactly 80 members");
        }
    }

    @Test
    @DisplayName("317 registrations -> exact 80/79/79/79 distribution across Sets A, B, C, D")
    void test317RegistrationsExactDistribution() {
        for (int i = 1; i <= 317; i++) {
            distributionService.assignStudentToSet(comp1.getId(), "reg_317_" + i);
        }

        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(comp1.getId());
        assertEquals(4, sets.size());

        long countA = memberRepository.countBySetId(sets.get(0).getId()); // A
        long countB = memberRepository.countBySetId(sets.get(1).getId()); // B
        long countC = memberRepository.countBySetId(sets.get(2).getId()); // C
        long countD = memberRepository.countBySetId(sets.get(3).getId()); // D

        assertEquals(80, countA, "Set A must have 80 members");
        assertEquals(79, countB, "Set B must have 79 members");
        assertEquals(79, countC, "Set C must have 79 members");
        assertEquals(79, countD, "Set D must have 79 members");
    }

    @Test
    @DisplayName("Idempotency: Re-assigning the same registration returns the existing assigned set")
    void testIdempotency() {
        CompetitionSetMember first = distributionService.assignStudentToSet(comp1.getId(), "reg_idempotent_1");
        assertNotNull(first);

        CompetitionSetMember second = distributionService.assignStudentToSet(comp1.getId(), "reg_idempotent_1");
        assertEquals(first.getId(), second.getId());
        assertEquals(first.getSetId(), second.getSetId());
    }

    @Test
    @DisplayName("Independent sets for two competitions")
    void testIndependentSetsForTwoCompetitions() {
        // Assign 5 students to comp1 -> Set A: 2, Set B: 1, Set C: 1, Set D: 1
        for (int i = 1; i <= 5; i++) {
            distributionService.assignStudentToSet(comp1.getId(), "reg_c1_" + i);
        }

        // Assign 2 students to comp2 -> Set A: 1, Set B: 1, Set C: 0, Set D: 0
        for (int i = 1; i <= 2; i++) {
            distributionService.assignStudentToSet(comp2.getId(), "reg_c2_" + i);
        }

        List<CompetitionSet> sets1 = setRepository.findByCompetitionIdOrderByCodeAsc(comp1.getId());
        List<CompetitionSet> sets2 = setRepository.findByCompetitionIdOrderByCodeAsc(comp2.getId());

        assertEquals(2, memberRepository.countBySetId(sets1.get(0).getId())); // comp1 Set A
        assertEquals(1, memberRepository.countBySetId(sets2.get(0).getId())); // comp2 Set A
        assertEquals(0, memberRepository.countBySetId(sets2.get(2).getId())); // comp2 Set C
    }

    @Test
    @DisplayName("Concurrent parallel registrations: set sizes differ by at most 1")
    void testConcurrentParallelRegistrations() throws Exception {
        int threadCount = 20;
        int totalRegistrations = 60;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<CompetitionSetMember>> futures = new ArrayList<>();

        for (int i = 1; i <= totalRegistrations; i++) {
            final String regId = "reg_parallel_" + i;
            futures.add(executor.submit(() -> {
                latch.await();
                return distributionService.assignStudentToSet(comp1.getId(), regId);
            }));
        }

        latch.countDown(); // start all threads simultaneously

        for (Future<CompetitionSetMember> f : futures) {
            assertNotNull(f.get(30, TimeUnit.SECONDS));
        }
        executor.shutdown();

        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(comp1.getId());
        assertEquals(4, sets.size());

        long min = Long.MAX_VALUE;
        long max = Long.MIN_VALUE;
        long total = 0;
        for (CompetitionSet s : sets) {
            long count = memberRepository.countBySetId(s.getId());
            total += count;
            if (count < min) min = count;
            if (count > max) max = count;
        }

        assertEquals(totalRegistrations, total);
        assertTrue(max - min <= 1, "Concurrent set distribution must balance sets such that max - min <= 1 (max=" + max + ", min=" + min + ")");
    }
}
