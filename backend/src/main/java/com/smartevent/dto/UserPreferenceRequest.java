package com.smartevent.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class UserPreferenceRequest {

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private Double codingPreference;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private Double communicationPreference;

    public UserPreferenceRequest() {
    }

    public UserPreferenceRequest(Double codingPreference, Double communicationPreference) {
        this.codingPreference = codingPreference;
        this.communicationPreference = communicationPreference;
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
}

