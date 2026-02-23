package com.smartevent.service;

import com.smartevent.dto.ExternalEventDto;
import com.smartevent.dto.RecommendationResponse;
import com.smartevent.dto.RecommendationSummaryResponse;
import com.smartevent.entity.Event;
import com.smartevent.entity.EventCategory;
import com.smartevent.entity.User;
import com.smartevent.repository.EventRepository;
import com.smartevent.repository.UserRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationService {

    private static final Logger logger =
            LoggerFactory.getLogger(RecommendationService.class);

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RecommendationScoringEngine scoringEngine;
    private final ExternalEventService externalEventService;

    public RecommendationService(EventRepository eventRepository,
                                 UserRepository userRepository,
                                 RecommendationScoringEngine scoringEngine,
                                 ExternalEventService externalEventService) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.scoringEngine = scoringEngine;
        this.externalEventService = externalEventService;
    }

    @Transactional(readOnly = true)
    public List<RecommendationResponse> getTopUpcomingEvents() {

        User user = getAuthenticatedUser();
        LocalDate today = LocalDate.now();

        List<Event> events = fetchExternalEvents();

        if (events.isEmpty()) {
            logger.info("Fallback injected");
            events = eventRepository.findByEventDateAfter(today.minusDays(1));
        }

        if (events == null || events.isEmpty()) {
            return List.of();
        }

        return events.stream()
                .map(event -> toRecommendationResponse(event, user))
                .sorted(Comparator.comparing(
                        RecommendationResponse::getFinalScore,
                        Comparator.reverseOrder()))
                .limit(5)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecommendationResponse> getLiveRecommendations() {
        return buildLiveRecommendationResult().recommendations();
    }

    @Transactional(readOnly = true)
    public RecommendationSummaryResponse getLiveRecommendationSummary() {
        LiveRecommendationResult result = buildLiveRecommendationResult();
        double averageScore = calculateAverageScore(result.recommendations());

        User user = result.user();
        double codingPreference = user == null || user.getCodingPreferenceWeight() == null
                ? 0.5
                : user.getCodingPreferenceWeight();
        double communicationPreference = user == null || user.getCommunicationPreferenceWeight() == null
                ? 0.5
                : user.getCommunicationPreferenceWeight();

        return new RecommendationSummaryResponse(
                result.totalEventsAnalyzed(),
                result.recommendations().size(),
                averageScore,
                codingPreference,
                communicationPreference
        );
    }

    private LiveRecommendationResult buildLiveRecommendationResult() {

        User user = getAuthenticatedUser();
        if (user == null) {
            throw new RuntimeException("Authenticated user is null");
        }

        List<ExternalEventDto> externalEvents =
                externalEventService.fetchUpcomingEvents();

        int externalSize = externalEvents == null ? 0 : externalEvents.size();
        logger.info("External events fetched: {}", externalSize);

        if (externalEvents == null) {
            externalEvents = List.of();
        }

        externalEvents = externalEvents.stream()
                .filter(dto -> isStrictTechEvent(dto == null ? null : dto.getTitle()))
                .toList();

        logger.info("External events after filtering: {}", externalEvents.size());

        List<Event> events = new ArrayList<>();

        if (externalEvents.isEmpty()) {
            logger.info("Fallback injected");
            events.addAll(injectFallbackTechEvents(user));
        } else {
            for (ExternalEventDto dto : externalEvents) {
                Event event = toEvent(dto);
                events.add(event);
            }
        }

        List<RecommendationResponse> responses = new ArrayList<>(events.size());
        for (Event event : events) {
            RecommendationScoringEngine.ScoringResult result =
                    scoringEngine.evaluate(user, event);

            if (result == null) {
                continue;
            }

            responses.add(new RecommendationResponse(
                    event.getId(),
                    event.getTitle(),
                    event.getCategory(),
                    event.getLocation(),
                    event.getMode(),
                    event.getEventDate(),
                    result.finalScore(),
                    result.explanation()
            ));
        }

        List<RecommendationResponse> sorted = responses.stream()
                .sorted(Comparator.comparing(
                        RecommendationResponse::getFinalScore,
                        Comparator.reverseOrder()))
                .limit(5)
                .toList();

        logger.info("Final returned count: {}", sorted.size());

        return new LiveRecommendationResult(events.size(), sorted, user);
    }

    private double calculateAverageScore(List<RecommendationResponse> recommendations) {
        if (recommendations == null || recommendations.isEmpty()) {
            return 0.0;
        }
        double total = 0.0;
        for (RecommendationResponse response : recommendations) {
            if (response != null) {
                total += response.getFinalScore();
            }
        }
        return total / recommendations.size();
    }

    private List<Event> fetchExternalEvents() {

        List<ExternalEventDto> externalEvents =
                externalEventService.fetchUpcomingEvents();

        if (externalEvents == null || externalEvents.isEmpty()) {
            return List.of();
        }

        return externalEvents.stream()
                .map(this::toEvent)
                .toList();
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

    private RecommendationResponse toRecommendationResponse(Event event,
                                                            User user) {

        RecommendationScoringEngine.ScoringResult result =
                scoringEngine.evaluate(user, event);

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
    }

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        logger.info("Authenticated user email: {}", email);

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Authenticated user not found"));
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
        event.setTitle(title);
        event.setDescription(title);
        event.setCategory(category);
        event.setLocation("Online");
        event.setMode(com.smartevent.entity.EventMode.ONLINE);
        event.setEventDate(LocalDate.now().plusWeeks(2));
        event.setCodingImpactScore(codingImpactScore);
        event.setCommunicationImpactScore(communicationImpactScore);
        event.setPopularityScore(popularityScore);
        event.setTags(new HashSet<>(List.of("AI", "ENGINEERING", "DEVELOPMENT")));
        return event;
    }

    private record LiveRecommendationResult(int totalEventsAnalyzed,
                                            List<RecommendationResponse> recommendations,
                                            User user) {
    }
}
