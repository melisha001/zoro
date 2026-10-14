package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.util.ScheduleTimeUtil;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/time")
public class TimeController {

    @org.springframework.beans.factory.annotation.Value("${schedule.resources-unlock-minutes:60}")
    private int resourcesUnlockMinutes;

    @GetMapping
    public ApiResponse<Map<String, Object>> getServerTime() {
        Map<String, Object> data = new HashMap<>();
        long nowMillis = System.currentTimeMillis();
        data.put("epochMillis", nowMillis);
        data.put("serverNow", nowMillis);
        data.put("zone", ScheduleTimeUtil.KOLKATA_ZONE.getId());
        data.put("iso", ScheduleTimeUtil.nowInKolkata().toString());
        data.put("resourcesUnlockMinutes", resourcesUnlockMinutes);
        return ApiResponse.ok(data);
    }
}
