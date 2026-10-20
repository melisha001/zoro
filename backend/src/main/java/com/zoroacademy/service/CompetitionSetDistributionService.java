package com.zoroacademy.service;

import com.zoroacademy.entity.CompetitionSet;
import com.zoroacademy.entity.CompetitionSetMember;
import com.zoroacademy.exception.ResourceNotFoundException;
import com.zoroacademy.repository.CompetitionRepository;
import com.zoroacademy.repository.CompetitionSetMemberRepository;
import com.zoroacademy.repository.CompetitionSetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CompetitionSetDistributionService {

    private static final Logger log = LoggerFactory.getLogger(CompetitionSetDistributionService.class);

    private final CompetitionRepository competitionRepository;
    private final CompetitionSetRepository setRepository;
    private final CompetitionSetMemberRepository setMemberRepository;

    public CompetitionSetDistributionService(CompetitionRepository competitionRepository,
                                             CompetitionSetRepository setRepository,
                                             CompetitionSetMemberRepository setMemberRepository) {
        this.competitionRepository = competitionRepository;
        this.setRepository = setRepository;
        this.setMemberRepository = setMemberRepository;
    }

    @Transactional
    public CompetitionSetMember assignStudentToSet(String compId, String regId) {
        // 1. Lock competition row to serialize set assignments across concurrent transactions
        competitionRepository.findByIdWithLock(compId)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found: " + compId));

        // 2. Check if already assigned (idempotent)
        Optional<CompetitionSetMember> existing = setMemberRepository.findByRegistrationId(regId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // 3. Ensure sets A, B, C, D exist
        List<CompetitionSet> sets = setRepository.findByCompetitionIdOrderByCodeAsc(compId);
        if (sets.isEmpty()) {
            for (String code : List.of("A", "B", "C", "D")) {
                CompetitionSet s = new CompetitionSet("set_" + compId + "_" + code, compId, code);
                setRepository.save(s);
                sets.add(s);
            }
        }

        // 4. Find set with fewest members (tie-break order: A > B > C > D)
        CompetitionSet bestSet = null;
        long minCount = Long.MAX_VALUE;

        for (CompetitionSet s : sets) {
            long count = setMemberRepository.countBySetId(s.getId());
            if (count < minCount) {
                minCount = count;
                bestSet = s;
            }
        }

        if (bestSet == null) {
            bestSet = sets.get(0);
        }

        // 5. Insert member
        CompetitionSetMember member = new CompetitionSetMember();
        member.setId("csm_" + UUID.randomUUID());
        member.setCompetitionId(compId);
        member.setRegistrationId(regId);
        member.setSetId(bestSet.getId());
        member = setMemberRepository.save(member);
        log.info("Assigned registration {} in competition {} to set {} (current set count: {})",
                regId, compId, bestSet.getCode(), minCount + 1);
        return member;
    }
}
