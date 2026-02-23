package com.smartevent.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FieldErrorResponse {

    private final String field;
    private final String message;
    private final Object rejectedValue;
}

