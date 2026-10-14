package com.zoroacademy.dto;

import java.util.List;

public class ReorderModulesRequest {
    private List<String> moduleIds;

    public ReorderModulesRequest() {}

    public ReorderModulesRequest(List<String> moduleIds) {
        this.moduleIds = moduleIds;
    }

    public List<String> getModuleIds() {
        return moduleIds;
    }

    public void setModuleIds(List<String> moduleIds) {
        this.moduleIds = moduleIds;
    }
}
