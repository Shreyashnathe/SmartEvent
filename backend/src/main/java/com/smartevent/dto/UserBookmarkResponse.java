package com.smartevent.dto;

import java.time.Instant;

public class UserBookmarkResponse {

    private final String eventId;
    private final Instant createdAt;

    public UserBookmarkResponse(String eventId, Instant createdAt) {
        this.eventId = eventId;
        this.createdAt = createdAt;
    }

    public String getEventId() {
        return eventId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

