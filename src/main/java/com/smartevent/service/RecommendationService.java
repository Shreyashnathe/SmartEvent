package com.smartevent.service;

import com.smartevent.dto.RecommendationResponse;
import com.smartevent.entity.Event;
import com.smartevent.entity.User;
import com.smartevent.repository.EventRepository;
import com.smartevent.repository.UserRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RecommendationScoringEngine scoringEngine;

    public RecommendationService(EventRepository eventRepository,
                                 UserRepository userRepository,
                                 RecommendationScoringEngine scoringEngine) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.scoringEngine = scoringEngine;
    }

    @Transactional(readOnly = true)
    public List<RecommendationResponse> getTopUpcomingEvents() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return List.of();
        }

        LocalDate today = LocalDate.now();

        List<Event> events = eventRepository
                .findByEventDateAfter(today.minusDays(1));

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

    private RecommendationResponse toRecommendationResponse(Event event, User user) {

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

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Invalid authentication principal");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Authenticated user not found in database"));
    }
}