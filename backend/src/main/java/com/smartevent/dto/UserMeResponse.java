package com.smartevent.dto;

import java.time.Instant;
import java.util.UUID;

public class UserMeResponse {

    private UUID id;
    private String email;
    private Double codingPreference;
    private Double communicationPreference;
    private Instant createdAt;

    public UserMeResponse() {
    }

    public UserMeResponse(UUID id,
                          String email,
                          Double codingPreference,
                          Double communicationPreference,
                          Instant createdAt) {
        this.id = id;
        this.email = email;
        this.codingPreference = codingPreference;
        this.communicationPreference = communicationPreference;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Double getCodingPreference() {
        return codingPreference;
    }

    public void setCodingPreference(Double codingPreference) {
        this.codingPreference = codingPreference;
    }

    public Double getCommunicationPreference() {
        return communicationPreference;
    }

    public void setCommunicationPreference(Double communicationPreference) {
        this.communicationPreference = communicationPreference;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

