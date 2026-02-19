package com.smartevent.service;

import com.smartevent.dto.RecommendationResponse;
import com.smartevent.entity.Event;
import com.smartevent.entity.EventMode;
import com.smartevent.entity.User;
import com.smartevent.repository.EventRepository;
import com.smartevent.repository.UserRepository;
import com.smartevent.repository.InteractionRepository;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private static final double INTEREST_MATCH_WEIGHT = 25.0;
    private static final double PERSONALIZATION_BOOST_WEIGHT = 15.0;
    private static final double CODING_WEIGHT = 0.3;
    private static final double COMMUNICATION_WEIGHT = 0.2;
    private static final double POPULARITY_WEIGHT = 0.1;
    private static final double SAME_LOCATION_BONUS = 20.0;
    private static final double ONLINE_BONUS = 10.0;

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final InteractionRepository interactionRepository;

    public RecommendationService(EventRepository eventRepository,
                                 UserRepository userRepository,
                                 InteractionRepository interactionRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.interactionRepository = interactionRepository;
    }

    public List<RecommendationResponse> getTopUpcomingEvents() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return List.of();
        }

        Set<String> interactedTags = getInteractedTags(user.getId());

        LocalDate today = LocalDate.now();
        List<Event> events = eventRepository.findByEventDateAfter(today.minusDays(1));

        return events.stream()
                .map(event -> toRecommendationResponse(event, user, interactedTags))
                .sorted(Comparator.comparing(RecommendationResponse::getFinalScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .toList();
    }

    private RecommendationResponse toRecommendationResponse(Event event, User user, Set<String> interactedTags) {
        Double finalScore = calculateFinalScore(event, user, interactedTags);
        return new RecommendationResponse(
                event.getId(),
                event.getTitle(),
                event.getCategory(),
                event.getLocation(),
                event.getMode(),
                event.getEventDate(),
                finalScore
        );
    }

    private double calculateFinalScore(Event event, User user, Set<String> interactedTags) {
        double score = 0.0;

        if (hasInterestMatch(event, user)) {
            score += INTEREST_MATCH_WEIGHT;
        }

        if (hasInteractedTagMatch(event, interactedTags)) {
            score += PERSONALIZATION_BOOST_WEIGHT;
        }

        score += safeScore(event.getCodingImpactScore()) * CODING_WEIGHT;
        score += safeScore(event.getCommunicationImpactScore()) * COMMUNICATION_WEIGHT;
        score += safeScore(event.getPopularityScore()) * POPULARITY_WEIGHT;

        if (isSameLocation(event, user)) {
            score += SAME_LOCATION_BONUS;
        } else if (event.getMode() == EventMode.ONLINE) {
            score += ONLINE_BONUS;
        }

        return score;
    }

    private boolean hasInteractedTagMatch(Event event, Set<String> interactedTags) {
        Set<String> tags = toLowercaseSet(event.getTags());
        if (tags.isEmpty() || interactedTags.isEmpty()) {
            return false;
        }
        return interactedTags.stream().anyMatch(tags::contains);
    }

    private Set<String> getInteractedTags(java.util.UUID userId) {
        Set<String> tags = new HashSet<>();
        interactionRepository.findByUserId(userId).forEach(interaction -> {
            Set<String> eventTags = interaction.getEvent() != null
                    ? toLowercaseSet(interaction.getEvent().getTags())
                    : Collections.emptySet();
            tags.addAll(eventTags);
        });
        return tags;
    }

    private boolean hasInterestMatch(Event event, User user) {
        Set<String> tags = toLowercaseSet(event.getTags());
        Set<String> interests = toLowercaseSet(user.getInterests());
        if (tags.isEmpty() || interests.isEmpty()) {
            return false;
        }
        return interests.stream().anyMatch(tags::contains);
    }

    private boolean isSameLocation(Event event, User user) {
        if (event.getLocation() == null || user.getLocation() == null) {
            return false;
        }
        return event.getLocation().equalsIgnoreCase(user.getLocation());
    }

    private Set<String> toLowercaseSet(Set<String> values) {
        if (values == null || values.isEmpty()) {
            return Collections.emptySet();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(value -> !value.isBlank())
                .collect(java.util.stream.Collectors.toSet());
    }

    private double safeScore(Integer value) {
        return value == null ? 0.0 : value;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(email).orElse(null);
    }
}
