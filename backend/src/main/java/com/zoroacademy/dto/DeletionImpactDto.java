package com.zoroacademy.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DeletionImpactDto {
    private boolean canDelete = true;
    private List<String> blockingReasons = new ArrayList<>();
    private Map<String, Long> counts = new HashMap<>();
    private Map<String, List<String>> names = new HashMap<>();

    public DeletionImpactDto() {}

    public DeletionImpactDto(boolean canDelete, List<String> blockingReasons, Map<String, Long> counts, Map<String, List<String>> names) {
        this.canDelete = canDelete;
        this.blockingReasons = blockingReasons != null ? blockingReasons : new ArrayList<>();
        this.counts = counts != null ? counts : new HashMap<>();
        this.names = names != null ? names : new HashMap<>();
    }

    public boolean isCanDelete() {
        return canDelete;
    }

    public void setCanDelete(boolean canDelete) {
        this.canDelete = canDelete;
    }

    public List<String> getBlockingReasons() {
        return blockingReasons;
    }

    public void setBlockingReasons(List<String> blockingReasons) {
        this.blockingReasons = blockingReasons;
    }

    public Map<String, Long> getCounts() {
        return counts;
    }

    public void setCounts(Map<String, Long> counts) {
        this.counts = counts;
    }

    public Map<String, List<String>> getNames() {
        return names;
    }

    public void setNames(Map<String, List<String>> names) {
        this.names = names;
    }
}
