package com.smartevent.dto;

import com.smartevent.entity.InteractionType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InteractionRequest {

    @NotNull
    private InteractionType interactionType;
}

