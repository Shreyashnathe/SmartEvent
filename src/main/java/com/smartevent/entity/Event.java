package com.smartevent.entity;

import com.smartevent.common.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
public class Event extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventCategory category;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "event_tags", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "tag", nullable = false)
    private Set<String> tags = new HashSet<>();

    @Column
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventMode mode;

    @Column
    private LocalDate eventDate;

    @Column
    private Integer codingImpactScore;

    @Column
    private Integer communicationImpactScore;

    @Column
    private Integer popularityScore;
}

