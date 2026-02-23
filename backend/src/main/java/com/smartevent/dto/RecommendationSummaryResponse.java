package com.smartevent.dto;

public class RecommendationSummaryResponse {

    private int totalEventsAnalyzed;
    private int totalRecommended;
    private double averageScore;
    private double userCodingPreference;
    private double userCommunicationPreference;

    public RecommendationSummaryResponse() {
    }

    public RecommendationSummaryResponse(int totalEventsAnalyzed,
                                         int totalRecommended,
                                         double averageScore,
                                         double userCodingPreference,
                                         double userCommunicationPreference) {
        this.totalEventsAnalyzed = totalEventsAnalyzed;
        this.totalRecommended = totalRecommended;
        this.averageScore = averageScore;
        this.userCodingPreference = userCodingPreference;
        this.userCommunicationPreference = userCommunicationPreference;
    }

    public int getTotalEventsAnalyzed() {
        return totalEventsAnalyzed;
    }

    public void setTotalEventsAnalyzed(int totalEventsAnalyzed) {
        this.totalEventsAnalyzed = totalEventsAnalyzed;
    }

    public int getTotalRecommended() {
        return totalRecommended;
    }

    public void setTotalRecommended(int totalRecommended) {
        this.totalRecommended = totalRecommended;
    }

    public double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(double averageScore) {
        this.averageScore = averageScore;
    }

    public double getUserCodingPreference() {
        return userCodingPreference;
    }

    public void setUserCodingPreference(double userCodingPreference) {
        this.userCodingPreference = userCodingPreference;
    }

    public double getUserCommunicationPreference() {
        return userCommunicationPreference;
    }

    public void setUserCommunicationPreference(double userCommunicationPreference) {
        this.userCommunicationPreference = userCommunicationPreference;
    }
}

