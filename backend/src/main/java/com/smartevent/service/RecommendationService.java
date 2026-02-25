package com.smartevent.service;

import com.smartevent.dto.ExternalEventDto;
import com.smartevent.dto.RecommendationResponse;
import com.smartevent.entity.Event;
import com.smartevent.entity.EventCategory;
import com.smartevent.entity.User;
import com.smartevent.repository.UserRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecommendationService {

    private static final Logger logger =
            LoggerFactory.getLogger(RecommendationService.class);

    private final UserRepository userRepository;
    private final RecommendationScoringEngine scoringEngine;
    private final ExternalEventService externalEventService;

    public RecommendationService(UserRepository userRepository,
                                  RecommendationScoringEngine scoringEngine,
                                  ExternalEventService externalEventService) {
        this.userRepository = userRepository;
        this.scoringEngine = scoringEngine;
        this.externalEventService = externalEventService;
    }

    @Transactional(readOnly = true)
    public List<RecommendationResponse> getLiveRecommendations() {
        return buildLiveRecommendationResult().recommendations();
    }

    private LiveRecommendationResult buildLiveRecommendationResult() {

        User user = getAuthenticatedUser();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Authenticated user is null");
        }

        List<ExternalEventDto> externalEvents =
                externalEventService.fetchUpcomingEvents();

        List<Event> events = (externalEvents == null ? List.<ExternalEventDto>of() : externalEvents).stream()
                .filter(dto -> isStrictTechEvent(dto == null ? null : dto.getTitle()))
                .map(this::toEvent)
                .toList();

        if (events.isEmpty()) {
            events = injectFallbackTechEvents(user);
        }

        List<RecommendationResponse> sorted = events.stream()
                .map(event -> {
                    RecommendationScoringEngine.ScoringResult result =
                            scoringEngine.evaluate(user, event);
                    if (result == null) {
                        return null;
                    }
                    return new RecommendationResponse(
                            event.getId(),
                            event.getTitle(),
                            event.getCategory(),
                            event.getLocation(),
                            event.getMode(),
                            event.getEventDate(),
                            result.finalScore(),
                            result.explanation()
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(
                        RecommendationResponse::getFinalScore,
                        Comparator.reverseOrder()))
                .limit(5)
                .toList();

        logger.info("Final returned count: {}", sorted.size());

        return new LiveRecommendationResult(events.size(), sorted, user);
    }

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        String email = authentication.getName();
        logger.info("Authenticated user email: {}", email);

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }

    public List<ExternalEventDto> getLiveTrendingEvents() {

        User user = getAuthenticatedUser();

        double codingPreference =
                user.getCodingPreferenceWeight() == null
                        ? 0.5
                        : user.getCodingPreferenceWeight();

        double communicationPreference =
                user.getCommunicationPreferenceWeight() == null
                        ? 0.5
                        : user.getCommunicationPreferenceWeight();

        String keyword;

        if (codingPreference > communicationPreference) {
            keyword = "developer conference";
        } else if (communicationPreference > codingPreference) {
            keyword = "leadership summit";
        } else {
            keyword = "technology";
        }

        List<ExternalEventDto> events =
                externalEventService.fetchTrendingEvents(keyword);

        if (events == null || events.isEmpty()) {
            events = externalEventService.fetchTrendingEvents(null);
        }

        return events == null ? List.of() : events;
    }

    private boolean isStrictTechEvent(String title) {
        if (title == null || title.isBlank()) {
            return false;
        }
        String text = title.toLowerCase();
        return text.contains("developer")
                || text.contains("programming")
                || text.contains("coding")
                || text.contains("hackathon")
                || text.contains("bootcamp")
                || text.contains("software")
                || text.contains("ai")
                || text.contains("data")
                || text.contains("engineering");
    }

    private List<Event> injectFallbackTechEvents(User user) {
        double codingPreference = user == null || user.getCodingPreferenceWeight() == null
                ? 0.5
                : user.getCodingPreferenceWeight();
        double communicationPreference = user == null || user.getCommunicationPreferenceWeight() == null
                ? 0.5
                : user.getCommunicationPreferenceWeight();

        List<Event> events = new ArrayList<>();

        if (codingPreference > communicationPreference) {
            events.add(buildFallbackEvent(
                    "Global Hackathon Series",
                    EventCategory.TECHNOLOGY,
                    95,
                    75,
                    90
            ));
            events.add(buildFallbackEvent(
                    "AI Developer Bootcamp 2026",
                    EventCategory.TECHNOLOGY,
                    92,
                    70,
                    88
            ));
            events.add(buildFallbackEvent(
                    "Full Stack Engineering Summit",
                    EventCategory.TECHNOLOGY,
                    85,
                    80,
                    82
            ));
            return events;
        }

        if (communicationPreference > codingPreference) {
            events.add(buildFallbackEvent(
                    "Full Stack Engineering Summit",
                    EventCategory.TECHNOLOGY,
                    85,
                    80,
                    82
            ));
            events.add(buildFallbackEvent(
                    "AI Developer Bootcamp 2026",
                    EventCategory.TECHNOLOGY,
                    92,
                    70,
                    88
            ));
            events.add(buildFallbackEvent(
                    "Global Hackathon Series",
                    EventCategory.TECHNOLOGY,
                    95,
                    75,
                    90
            ));
            return events;
        }

        events.add(buildFallbackEvent(
                "AI Developer Bootcamp 2026",
                EventCategory.TECHNOLOGY,
                92,
                70,
                88
        ));
        events.add(buildFallbackEvent(
                "Full Stack Engineering Summit",
                EventCategory.TECHNOLOGY,
                85,
                80,
                82
        ));
        events.add(buildFallbackEvent(
                "Global Hackathon Series",
                EventCategory.TECHNOLOGY,
                95,
                75,
                90
        ));
        return events;
    }

    private Event buildFallbackEvent(String title,
                                     EventCategory category,
                                     int codingImpactScore,
                                     int communicationImpactScore,
                                     int popularityScore) {
        Event event = new Event();
        UUID fallbackId = UUID.randomUUID();
        try {
            java.lang.reflect.Field idField = com.smartevent.common.BaseEntity.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(event, fallbackId);
        } catch (ReflectiveOperationException ex) {
            logger.warn("Failed to set fallback event id", ex);
        }
        event.setTitle(title);
        event.setDescription(title);
        event.setCategory(category);
        event.setLocation("Online");
        event.setMode(com.smartevent.entity.EventMode.ONLINE);
        event.setEventDate(java.time.LocalDate.now().plusWeeks(2));
        event.setCodingImpactScore(codingImpactScore);
        event.setCommunicationImpactScore(communicationImpactScore);
        event.setPopularityScore(popularityScore);
        event.setTags(new HashSet<>(List.of("AI", "ENGINEERING", "DEVELOPMENT")));
        return event;
    }

    private Event toEvent(ExternalEventDto dto) {

        Event event = new Event();

        event.setTitle(dto.getTitle());

        // No description in external API → use title as fallback
        event.setDescription(dto.getTitle());

        event.setCategory(toCategory(dto.getCategory()));

        event.setLocation(dto.getLocation());

        // External events are assumed ONLINE
        event.setMode(com.smartevent.entity.EventMode.ONLINE);

        event.setEventDate(dto.getEventDate());

        event.setPopularityScore(dto.getPopularityScore());
        event.setCodingImpactScore(dto.getCodingImpactScore());
        event.setCommunicationImpactScore(dto.getCommunicationImpactScore());

        event.setTags(dto.getTags() == null
                ? new HashSet<>()
                : new HashSet<>(dto.getTags()));

        return event;
    }

    private EventCategory toCategory(String value) {

        if (value == null || value.isBlank()) {
            return EventCategory.OTHER;
        }

        String normalized =
                value.trim().replace(" ", "_").toUpperCase();

        try {
            return EventCategory.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return EventCategory.OTHER;
        }
    }

    private record LiveRecommendationResult(int totalEventsAnalyzed,
                                            List<RecommendationResponse> recommendations,
                                            User user) {
    }
}
