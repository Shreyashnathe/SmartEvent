package com.smartevent.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartevent.entity.Event;
import com.smartevent.entity.EventMode;
import com.smartevent.entity.User;
import com.smartevent.repository.InteractionRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RecommendationScoringEngineTest {

    @Mock
    private InteractionRepository interactionRepository;

    private RecommendationScoringEngine scoringEngine;

    @BeforeEach
    void setUp() {
        scoringEngine = new RecommendationScoringEngine(interactionRepository);
        when(interactionRepository.findByUserId(null)).thenReturn(List.of());
    }

    @Test
    void shouldScoreInterestMatch() {
        User user = new User();
        user.setInterests(Set.of("Java"));
        user.setSkills(Set.of(""));
        user.setCodingPreferenceWeight(0.5);
        user.setCommunicationPreferenceWeight(0.5);

        Event event = new Event();
        event.setTags(Set.of("java"));
        event.setMode(EventMode.OFFLINE);

        RecommendationScoringEngine.ScoringResult result = scoringEngine.evaluate(user, event);

        assertThat(result.finalScore()).isEqualTo(25.0);
        assertThat(result.explanation()).contains("Matched your interest in java");
    }

    @Test
    void shouldUseColdStartFallbackScore() {
        User user = new User();

        Event event = new Event();
        event.setPopularityScore(80);
        event.setEventDate(LocalDate.now().plusDays(1));

        RecommendationScoringEngine.ScoringResult result = scoringEngine.evaluate(user, event);

        double expected = 80 + (1.0 / 2.0);
        assertThat(result.finalScore()).isEqualTo(expected);
        assertThat(result.explanation()).isEqualTo("Popular upcoming event");
    }

    @Test
    void shouldApplyPreferenceWeightsToScores() {
        User userHighPreference = new User();
        userHighPreference.setInterests(Set.of("python"));
        userHighPreference.setCodingPreferenceWeight(1.0);
        userHighPreference.setCommunicationPreferenceWeight(0.0);

        User userLowPreference = new User();
        userLowPreference.setInterests(Set.of("python"));
        userLowPreference.setCodingPreferenceWeight(0.2);
        userLowPreference.setCommunicationPreferenceWeight(0.0);

        Event event = new Event();
        event.setTags(Set.of("java"));
        event.setCodingImpactScore(100);
        event.setCommunicationImpactScore(100);
        event.setPopularityScore(0);
        event.setMode(EventMode.OFFLINE);

        double highScore = scoringEngine.evaluate(userHighPreference, event).finalScore();
        double lowScore = scoringEngine.evaluate(userLowPreference, event).finalScore();

        assertThat(highScore - lowScore).isEqualTo(24.0);
    }
}

