package com.smartevent.controller;

import com.smartevent.dto.SystemInfoResponse;
import com.smartevent.repository.EventRepository;
import com.smartevent.repository.InteractionRepository;
import com.smartevent.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemInfoController {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final InteractionRepository interactionRepository;

    public SystemInfoController(UserRepository userRepository,
                                EventRepository eventRepository,
                                InteractionRepository interactionRepository) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.interactionRepository = interactionRepository;
    }

    @GetMapping("/info")
    public SystemInfoResponse getSystemInfo() {
        return new SystemInfoResponse(
                userRepository.count(),
                eventRepository.count(),
                interactionRepository.count()
        );
    }
}

