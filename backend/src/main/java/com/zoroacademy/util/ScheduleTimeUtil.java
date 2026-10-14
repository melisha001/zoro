package com.zoroacademy.util;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Shared utility for parsing and evaluating schedule dates and time ranges
 * strictly within the Asia/Kolkata timezone (Requirement T4, T5, Global Rule 4).
 */
public final class ScheduleTimeUtil {

    public static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final Pattern TIME_PATTERN = Pattern.compile("(\\d{1,2}):(\\d{2})(?:\\s*(AM|PM))?", Pattern.CASE_INSENSITIVE);

    private ScheduleTimeUtil() {}

    public static ZonedDateTime nowInKolkata() {
        return ZonedDateTime.now(KOLKATA_ZONE);
    }

    public static int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return 0;
        String startPart = timeStr.split("-")[0].trim();
        Matcher matcher = TIME_PATTERN.matcher(startPart);
        if (!matcher.find()) return 0;

        int hours = Integer.parseInt(matcher.group(1));
        int minutes = Integer.parseInt(matcher.group(2));
        String ampm = matcher.group(3);

        if (ampm != null) {
            String upper = ampm.toUpperCase(Locale.ROOT);
            if ("PM".equals(upper) && hours < 12) {
                hours += 12;
            } else if ("AM".equals(upper) && hours == 12) {
                hours = 0;
            }
        }
        return hours * 60 + minutes;
    }

    public static int parseEndTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return 60;
        String[] parts = timeStr.split("-");
        if (parts.length > 1) {
            String endPart = parts[1].trim();
            Matcher matcher = TIME_PATTERN.matcher(endPart);
            if (matcher.find()) {
                int hours = Integer.parseInt(matcher.group(1));
                int minutes = Integer.parseInt(matcher.group(2));
                String ampm = matcher.group(3);
                if (ampm != null) {
                    String upper = ampm.toUpperCase(Locale.ROOT);
                    if ("PM".equals(upper) && hours < 12) {
                        hours += 12;
                    } else if ("AM".equals(upper) && hours == 12) {
                        hours = 0;
                    }
                }
                return hours * 60 + minutes;
            }
        }
        // Fallback: start + 60 minutes
        return parseTimeToMinutes(timeStr) + 60;
    }

    public static ZonedDateTime getSessionStart(String dateStr, String timeStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            LocalDate date = LocalDate.parse(dateStr.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            int startMinutes = parseTimeToMinutes(timeStr);
            LocalTime time = LocalTime.of(startMinutes / 60, startMinutes % 60);
            return ZonedDateTime.of(date, time, KOLKATA_ZONE);
        } catch (Exception e) {
            return null;
        }
    }

    public static ZonedDateTime getSessionEnd(String dateStr, String timeStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            LocalDate date = LocalDate.parse(dateStr.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            int endMinutes = parseEndTimeToMinutes(timeStr);
            int hour = Math.min(23, endMinutes / 60);
            int minute = endMinutes % 60;
            return ZonedDateTime.of(date, LocalTime.of(hour, minute), KOLKATA_ZONE);
        } catch (Exception e) {
            return null;
        }
    }

    public static final int DEFAULT_UNLOCK_MINUTES = 60;

    public static boolean isSessionActive(String dateStr, String timeStr, ZonedDateTime now) {
        ZonedDateTime start = getSessionStart(dateStr, timeStr);
        ZonedDateTime end = getSessionEnd(dateStr, timeStr);
        if (start == null || end == null) return false;
        return !now.isBefore(start) && !now.isAfter(end);
    }

    public static boolean isSessionFinished(String dateStr, String timeStr, ZonedDateTime now) {
        ZonedDateTime end = getSessionEnd(dateStr, timeStr);
        if (end == null) return false;
        return !now.isBefore(end);
    }

    public static boolean isDocumentUnlocked(String dateStr, String timeStr, ZonedDateTime now, int unlockMinutes) {
        ZonedDateTime start = getSessionStart(dateStr, timeStr);
        if (start == null) return true;
        ZonedDateTime unlockThreshold = start.minusMinutes(unlockMinutes > 0 ? unlockMinutes : DEFAULT_UNLOCK_MINUTES);
        return !now.isBefore(unlockThreshold);
    }

    public static boolean isDocumentUnlocked(String dateStr, String timeStr, ZonedDateTime now) {
        return isDocumentUnlocked(dateStr, timeStr, now, DEFAULT_UNLOCK_MINUTES);
    }

    public static ZonedDateTime getUnlockTime(String dateStr, String timeStr, int unlockMinutes) {
        ZonedDateTime start = getSessionStart(dateStr, timeStr);
        if (start == null) return null;
        return start.minusMinutes(unlockMinutes > 0 ? unlockMinutes : DEFAULT_UNLOCK_MINUTES);
    }

    public static String formatUnlockTime(String dateStr, String timeStr, int unlockMinutes) {
        ZonedDateTime unlock = getUnlockTime(dateStr, timeStr, unlockMinutes);
        if (unlock == null) return "60 mins before class";
        return "Unlocks at " + unlock.format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
    }
}
