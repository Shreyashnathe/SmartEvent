package com.smartevent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartevent.config.TicketmasterProperties;
import com.smartevent.dto.ExternalEventDto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class ExternalEventService {

    private static final Logger logger = LoggerFactory.getLogger(ExternalEventService.class);

    private final WebClient webClient;
    private final TicketmasterProperties ticketmasterProperties;
    private final ObjectMapper objectMapper;

    public ExternalEventService(@Qualifier("ticketmasterWebClient") WebClient webClient,
                                TicketmasterProperties ticketmasterProperties,
                                ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.ticketmasterProperties = ticketmasterProperties;
        this.objectMapper = objectMapper;
    }

    public List<ExternalEventDto> fetchUpcomingEvents() {
        return fetchAndFilterEvents(null);
    }

    public List<ExternalEventDto> fetchTrendingEvents(String keyword) {
        return fetchAndFilterEvents(keyword);
    }

    private List<ExternalEventDto> fetchAndFilterEvents(String keyword) {
        try {
            String response = webClient.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder
                                .path("/events.json")
                                .queryParam("apikey", ticketmasterProperties.getApiKey())
                                .queryParam("size", 20)
                                .queryParam("sort", "date,asc")
                                .queryParam("countryCode", "US");

                        if (keyword != null && !keyword.isBlank()) {
                            builder.queryParam("keyword", keyword);
                        }

                        var uri = builder.build();
                        logger.info("Ticketmaster events URL: {}", uri);
                        return uri;
                    })
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null || response.isBlank()) {
                logger.info("Ticketmaster events returned: 0");
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode eventsNode = root.path("_embedded").path("events");
            if (!eventsNode.isArray()) {
                logger.info("Ticketmaster events returned: 0");
                return List.of();
            }

            List<ExternalEventDto> results = new ArrayList<>();
            int totalFetched = eventsNode.size();
            int totalKept = 0;
            for (JsonNode eventNode : eventsNode) {
                Map<String, Object> eventMap = objectMapper.convertValue(eventNode, Map.class);
                if (!isRelevantEvent(eventMap)) {
                    continue;
                }
                totalKept++;

                ExternalEventDto dto = new ExternalEventDto();
                dto.setId(textOrNull(eventNode.path("id")));
                String title = textOrNull(eventNode.path("name"));
                dto.setTitle(title);

                String eventDateText = textOrNull(eventNode.path("dates").path("start").path("localDate"));
                dto.setEventDate(parseLocalDate(eventDateText));

                String category = determineCategoryFromTitle(title);
                dto.setCategory(category);
                dto.setLocation(textOrNull(eventNode.path("_embedded").path("venues").path(0)
                        .path("city").path("name")));

                dto.setPopularityScore(randomBetween(50, 100));
                applyImpactScores(dto, title);
                dto.setTags(splitCategoryTags(category));

                results.add(dto);
            }

            logger.info("Ticketmaster events fetched: {}", totalFetched);
            logger.info("Ticketmaster events after filtering: {}", totalKept);

            if (results.isEmpty()) {
                return List.of();
            }

            logger.info("Ticketmaster events returned: {}", results.size());
            return results;
        } catch (Exception ex) {
            logger.error("Failed to fetch external events from Ticketmaster", ex);
            return List.of();
        }
    }

    private boolean isRelevantEvent(Map<String, Object> eventMap) {
        if (eventMap == null || eventMap.isEmpty()) {
            return false;
        }

        List<Object> classifications = asList(eventMap.get("classifications"));
        if (classifications.isEmpty()) {
            return false;
        }

        Map<String, Object> firstClassification = asMap(classifications.get(0));
        Map<String, Object> segment = asMap(firstClassification.get("segment"));
        String segmentName = asString(segment.get("name"));
        if (segmentName == null) {
            return false;
        }

        if (segmentName.equalsIgnoreCase("Music")
                || segmentName.equalsIgnoreCase("Sports")
                || segmentName.equalsIgnoreCase("Film")
                || segmentName.equalsIgnoreCase("Arts & Theatre")
                || segmentName.equalsIgnoreCase("Entertainment")) {
            return false;
        }

        if (!segmentName.equalsIgnoreCase("Miscellaneous")) {
            return false;
        }

        String title = asString(eventMap.get("name"));
        if (title == null) {
            return false;
        }

        String text = title.toLowerCase();
        return containsAny(text,
                "developer", "tech", "technology", "coding",
                "programming", "hackathon", "bootcamp", "ai",
                "data", "cloud computing", "software engineering");
    }

    private Integer randomBetween(int minInclusive, int maxInclusive) {
        return ThreadLocalRandom.current().nextInt(minInclusive, maxInclusive + 1);
    }

    private void applyImpactScores(ExternalEventDto dto, String title) {
        String normalizedTitle = normalize(title);
        if (containsKeyword(normalizedTitle, "hackathon")) {
            dto.setCodingImpactScore(randomBetween(90, 100));
            dto.setCommunicationImpactScore(randomBetween(60, 75));
            return;
        }
        if (containsKeyword(normalizedTitle, "bootcamp")) {
            dto.setCodingImpactScore(randomBetween(80, 95));
            dto.setCommunicationImpactScore(randomBetween(60, 75));
            return;
        }
        if (containsKeyword(normalizedTitle, "summit")) {
            dto.setCodingImpactScore(randomBetween(60, 75));
            dto.setCommunicationImpactScore(randomBetween(80, 95));
            return;
        }
        if (containsKeyword(normalizedTitle, "workshop")) {
            dto.setCodingImpactScore(randomBetween(70, 85));
            dto.setCommunicationImpactScore(randomBetween(70, 85));
            return;
        }
        dto.setCodingImpactScore(randomBetween(60, 75));
        dto.setCommunicationImpactScore(randomBetween(60, 75));
    }

    private String determineCategoryFromTitle(String title) {

        if (title == null || title.isBlank()) {
            return "OTHER";
        }

        String text = title.toLowerCase();

        // 🔥 Technology related
        if (containsAny(text,
                "tech", "technology", "developer", "coding",
                "hackathon", "programming", "ai", "data",
                "cloud", "backend", "frontend", "software")) {
            return "TECHNOLOGY";
        }

        // 🔥 Business related
        if (containsAny(text,
                "business", "startup", "entrepreneur",
                "leadership", "management", "finance")) {
            return "BUSINESS";
        }

        // 🔥 Marketing related
        if (containsAny(text,
                "marketing", "branding", "sales",
                "growth", "digital marketing")) {
            return "MARKETING";
        }

        // 🔥 Education related
        if (containsAny(text,
                "bootcamp", "workshop", "training",
                "course", "learning", "research")) {
            return "EDUCATION";
        }

        // 🔥 Design related
        if (containsAny(text,
                "design", "ux", "ui", "creative")) {
            return "DESIGN";
        }

        return "OTHER";
    }

    private boolean containsKeyword(String text, String keyword) {
        return text != null && !text.isBlank() && text.contains(keyword);
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null || text.isBlank()) {
            return false;
        }
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase();
    }

    private LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        return value == null || value.isBlank() ? null : value;
    }

    private Set<String> splitCategoryTags(String category) {
        if (category == null || category.isBlank()) {
            return Collections.emptySet();
        }
        Set<String> tags = new HashSet<>();
        for (String part : category.split("\\s+")) {
            String trimmed = part.trim();
            if (!trimmed.isBlank()) {
                tags.add(trimmed);
            }
        }
        return tags;
    }

    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> mapValue) {
            Map<String, Object> result = new java.util.HashMap<>();
            for (Map.Entry<?, ?> entry : mapValue.entrySet()) {
                if (entry.getKey() instanceof String key) {
                    result.put(key, entry.getValue());
                }
            }
            return result;
        }
        return Collections.emptyMap();
    }

    private List<Object> asList(Object value) {
        if (value instanceof List<?> listValue) {
            return new ArrayList<>(listValue);
        }
        return Collections.emptyList();
    }

    private Object nestedValue(Map<String, Object> root, String... keys) {
        Object current = root;
        for (String key : keys) {
            if (current == null) {
                return null;
            }
            if (current instanceof Map<?, ?> mapValue) {
                current = mapValue.get(key);
                continue;
            }
            if (current instanceof List<?> listValue) {
                int index = parseIndex(key);
                if (index < 0 || index >= listValue.size()) {
                    return null;
                }
                current = listValue.get(index);
                continue;
            }
            return null;
        }
        return current;
    }

    private int parseIndex(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() ? null : text;
    }
}

