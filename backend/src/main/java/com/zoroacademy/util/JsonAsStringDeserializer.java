package com.zoroacademy.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * Reusable Jackson deserializer that tolerates incoming JSON objects, arrays, or strings,
 * normalizing all valid JSON structures into a compact JSON string, or null for empty/blank values.
 */
public class JsonAsStringDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() == JsonToken.VALUE_NULL) {
            return null;
        }

        JsonNode node = p.getCodec().readTree(p);
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isTextual()) {
            String text = node.asText();
            if (text == null || text.trim().isEmpty() || "null".equalsIgnoreCase(text.trim())) {
                return null;
            }
            String trimmed = text.trim();
            // Validate if trimmed string is already a valid JSON structure (e.g. object, array, or quoted string)
            ObjectMapper mapper = (ObjectMapper) p.getCodec();
            try {
                mapper.readTree(trimmed);
                return trimmed;
            } catch (Exception e) {
                // Not valid JSON by itself (e.g. plain text, url, simple name); wrap as valid JSON string
                return mapper.writeValueAsString(trimmed);
            }
        }

        // For ObjectNode, ArrayNode, NumericNode, BooleanNode, etc.
        String json = node.toString();
        if (json == null || json.trim().isEmpty() || "null".equalsIgnoreCase(json.trim())) {
            return null;
        }
        return json.trim();
    }

    @Override
    public String getNullValue(DeserializationContext ctxt) {
        return null;
    }
}
