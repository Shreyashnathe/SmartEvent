package com.smartevent.controller;

import com.smartevent.dto.ExternalEventDto;
import com.smartevent.service.RecommendationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final RecommendationService recommendationService;

    public EventController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/trending")
    public List<ExternalEventDto> getTrendingEvents() {
        return recommendationService.getLiveTrendingEvents();
    }
}