package com.smartevent.dto;

import com.smartevent.entity.EventCategory;
import com.smartevent.entity.EventMode;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RecommendationResponse {

    private final UUID id;
    private final String title;
    private final EventCategory category;
    private final String location;
    private final EventMode mode;
    private final LocalDate eventDate;
    private final Double finalScore;
    private final String explanation;
}
