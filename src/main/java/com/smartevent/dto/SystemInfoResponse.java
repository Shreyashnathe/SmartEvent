package com.smartevent.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SystemInfoResponse {

    private final long totalUsers;
    private final long totalEvents;
    private final long totalInteractions;
}

