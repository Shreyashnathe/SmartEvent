package com.smartevent.controller;

import com.smartevent.dto.RecommendationResponse;
import com.smartevent.entity.Event;
import com.smartevent.service.RecommendationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public List<RecommendationResponse> getRecommendations() {
        return recommendationService.getTopUpcomingEvents();
    }
}
