package com.smartevent.dto;

import java.time.LocalDate;
import java.util.Set;

public class ExternalEventDto {

    private String id;
    private String title;
    private String location;
    private LocalDate eventDate;

    private String category;
    private Integer popularityScore;
    private Integer codingImpactScore;
    private Integer communicationImpactScore;
    private Set<String> tags;

    public ExternalEventDto() {
    }

    public ExternalEventDto(String id, String title, String location, LocalDate eventDate) {
        this.id = id;
        this.title = title;
        this.location = location;
        this.eventDate = eventDate;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getLocation() { return location; }
    public LocalDate getEventDate() { return eventDate; }
    public String getCategory() { return category; }
    public Integer getPopularityScore() { return popularityScore; }
    public Integer getCodingImpactScore() { return codingImpactScore; }
    public Integer getCommunicationImpactScore() { return communicationImpactScore; }
    public Set<String> getTags() { return tags; }

    public void setId(String id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setLocation(String location) { this.location = location; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }
    public void setCategory(String category) { this.category = category; }
    public void setPopularityScore(Integer popularityScore) { this.popularityScore = popularityScore; }
    public void setCodingImpactScore(Integer codingImpactScore) { this.codingImpactScore = codingImpactScore; }
    public void setCommunicationImpactScore(Integer communicationImpactScore) { this.communicationImpactScore = communicationImpactScore; }
    public void setTags(Set<String> tags) { this.tags = tags; }
}