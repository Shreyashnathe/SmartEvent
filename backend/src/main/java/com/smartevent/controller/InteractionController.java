package com.smartevent.controller;

import com.smartevent.dto.InteractionRequest;
import com.smartevent.entity.Event;
import com.smartevent.entity.Interaction;
import com.smartevent.entity.InteractionType;
import com.smartevent.entity.User;
import com.smartevent.repository.EventRepository;
import com.smartevent.repository.InteractionRepository;
import com.smartevent.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/interactions")
public class InteractionController {

    private static final int VIEW_POPULARITY_INCREMENT = 1;
    private static final int REGISTER_POPULARITY_INCREMENT = 5;

    private final InteractionRepository interactionRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public InteractionController(InteractionRepository interactionRepository,
                                 EventRepository eventRepository,
                                 UserRepository userRepository) {
        this.interactionRepository = interactionRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/{eventId}")
    public ResponseEntity<Void> createInteraction(@PathVariable java.util.UUID eventId,
                                                  @Valid @RequestBody InteractionRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        Interaction interaction = new Interaction();
        interaction.setUser(user);
        interaction.setEvent(event);
        interaction.setInteractionType(request.getInteractionType());
        interactionRepository.save(interaction);

        applyPopularityBoost(event, request.getInteractionType());
        eventRepository.save(event);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    private void applyPopularityBoost(Event event, InteractionType interactionType) {
        int current = Optional.ofNullable(event.getPopularityScore()).orElse(0);
        if (interactionType == InteractionType.VIEW) {
            event.setPopularityScore(current + VIEW_POPULARITY_INCREMENT);
        } else if (interactionType == InteractionType.REGISTER) {
            event.setPopularityScore(current + REGISTER_POPULARITY_INCREMENT);
        }
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(email).orElse(null);
    }
}

