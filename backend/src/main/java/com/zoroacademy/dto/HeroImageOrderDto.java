package com.zoroacademy.dto;

public class HeroImageOrderDto {

    private String id;
    private Integer sortOrder;

    public HeroImageOrderDto() {}

    public HeroImageOrderDto(String id, Integer sortOrder) {
        this.id = id;
        this.sortOrder = sortOrder;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
