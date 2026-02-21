package com.smartevent.service;

import com.smartevent.entity.Event;
import com.smartevent.entity.EventMode;
import com.smartevent.entity.User;
import com.smartevent.repository.InteractionRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class RecommendationScoringEngine {

    private static final double INTEREST_MATCH_WEIGHT = 25.0;
    private static final double PERSONALIZATION_BOOST_WEIGHT = 15.0;
    private static final double CODING_WEIGHT = 0.3;
    private static final double COMMUNICATION_WEIGHT = 0.2;
    private static final double POPULARITY_WEIGHT = 0.1;
    private static final double SAME_LOCATION_BONUS = 20.0;
    private static final double ONLINE_BONUS = 10.0;

    private final InteractionRepository interactionRepository;

    public RecommendationScoringEngine(InteractionRepository interactionRepository) {
        this.interactionRepository = interactionRepository;
    }

    public ScoringResult evaluate(User user, Event event) {

        if (user == null || event == null) {
            return new ScoringResult(0.0, "Invalid recommendation data");
        }

        Set<String> interests = safeSet(user.getInterests());
        Set<String> skills = safeSet(user.getSkills());
        Set<String> interactedTags = getInteractedTags(user.getId());

        if (isColdStart(interests, skills, interactedTags)) {
            return new ScoringResult(fallbackScore(event),
                    fallbackExplanation(event));
        }

        double score = 0.0;
        List<String> reasons = new ArrayList<>();

        String matchedInterest = firstMatch(event.getTags(), interests);

        if (matchedInterest != null) {
            score += INTEREST_MATCH_WEIGHT;
            reasons.add("Matched your interest in " + matchedInterest);
        }

        if (hasInteractedTagMatch(event, interactedTags)) {
            score += PERSONALIZATION_BOOST_WEIGHT;
            reasons.add("Based on your past activity");
        }

        int coding = safeScore(event.getCodingImpactScore());
        int communication = safeScore(event.getCommunicationImpactScore());
        int popularity = safeScore(event.getPopularityScore());

        double codingPreference = normalizePreference(user.getCodingPreferenceWeight());
        double communicationPreference = normalizePreference(user.getCommunicationPreferenceWeight());

        score += coding * CODING_WEIGHT * codingPreference;
        score += communication * COMMUNICATION_WEIGHT * communicationPreference;
        score += popularity * POPULARITY_WEIGHT;

        if (isSameLocation(event, user)) {
            score += SAME_LOCATION_BONUS;
            reasons.add("Popular in your location");
        } else if (event.getMode() == EventMode.ONLINE) {
            score += ONLINE_BONUS;
            reasons.add("Available online");
        }

        return new ScoringResult(score, buildExplanation(reasons));
    }

    private Set<String> safeSet(Set<String> values) {
        if (values == null) return Collections.emptySet();
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(v -> !v.isBlank())
                .collect(java.util.stream.Collectors.toSet());
    }

    private boolean isColdStart(Set<String> interests,
                                Set<String> skills,
                                Set<String> interactedTags) {
        return interests.isEmpty() && skills.isEmpty() && interactedTags.isEmpty();
    }

    private String firstMatch(Set<String> tags, Set<String> interests) {
        Set<String> normalizedTags = safeSet(tags);
        for (String interest : interests) {
            if (normalizedTags.contains(interest)) {
                return interest;
            }
        }
        return null;
    }

    private boolean hasInteractedTagMatch(Event event, Set<String> interactedTags) {
        Set<String> tags = safeSet(event.getTags());
        return interactedTags.stream().anyMatch(tags::contains);
    }

    private Set<String> getInteractedTags(UUID userId) {

        if (userId == null) return Collections.emptySet();

        var interactions = interactionRepository.findByUserId(userId);

        if (interactions == null || interactions.isEmpty()) {
            return Collections.emptySet();
        }

        Set<String> tags = new HashSet<>();

        interactions.forEach(interaction -> {
            if (interaction != null && interaction.getEvent() != null) {
                tags.addAll(safeSet(interaction.getEvent().getTags()));
            }
        });

        return tags;
    }

    private boolean isSameLocation(Event event, User user) {
        if (event.getLocation() == null || user.getLocation() == null)
            return false;
        return event.getLocation().equalsIgnoreCase(user.getLocation());
    }

    private int safeScore(Integer value) {
        return value == null ? 0 : value;
    }

    private double normalizePreference(Double value) {
        if (value == null) return 0.5;
        return Math.max(0.0, Math.min(1.0, value));
    }

    private double fallbackScore(Event event) {
        int popularity = safeScore(event.getPopularityScore());
        double dateBoost = calculateDateBoost(event.getEventDate());
        return popularity + dateBoost;
    }

    private double calculateDateBoost(LocalDate eventDate) {
        if (eventDate == null) return 0.0;
        long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), eventDate);
        if (daysUntil < 0) return 0.0;
        return 1.0 / (daysUntil + 1);
    }

    private String fallbackExplanation(Event event) {
        if (safeScore(event.getPopularityScore()) >= 70)
            return "Popular upcoming event";
        return "Upcoming soon";
    }

    private String buildExplanation(List<String> reasons) {
        if (reasons.isEmpty()) return "Recommended event";
        return String.join("; ", reasons);
    }

    public record ScoringResult(double finalScore, String explanation) {}
}