package com.smartevent.service;

import com.smartevent.entity.Event;
import com.smartevent.entity.EventCategory;
import com.smartevent.entity.EventMode;
import com.smartevent.repository.EventRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MockEventProviderService {

    private static final int EVENTS_PER_RUN = 20;
    private static final int MIN_DAYS_AHEAD = 1;
    private static final int MAX_DAYS_AHEAD = 60;

    private static final List<String> TITLES = List.of(
            "Spring Boot Meetup",
            "Java Performance Workshop",
            "Cloud Native Summit",
            "Product Design Sprint",
            "AI for Developers",
            "Security Best Practices",
            "Data Engineering Bootcamp",
            "Startup Pitch Night",
            "UX Research Lab",
            "Kotlin for Backend"
    );

    private static final List<String> LOCATIONS = List.of(
            "Mumbai",
            "Pune",
            "Bengaluru",
            "Hyderabad",
            "Chennai",
            "Delhi",
            "Kolkata",
            "Remote",
            "Singapore",
            "Dubai"
    );

    private static final List<String> TAGS = List.of(
            "java",
            "spring",
            "backend",
            "cloud",
            "security",
            "ai",
            "design",
            "data",
            "startup",
            "devops"
    );

    private final EventRepository eventRepository;

    public MockEventProviderService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Scheduled(fixedRateString = "PT24H")
    public void generateMockEvents() {
        List<Event> events = new ArrayList<>(EVENTS_PER_RUN);

        for (int i = 0; i < EVENTS_PER_RUN; i++) {
            Event event = new Event();
            event.setTitle(randomFrom(TITLES));
            event.setDescription("Auto-generated event for testing purposes.");
            event.setCategory(randomEnum(EventCategory.class));
            event.setTags(randomTags());
            event.setLocation(randomFrom(LOCATIONS));
            event.setMode(randomEnum(EventMode.class));
            event.setEventDate(randomFutureDate());
            event.setCodingImpactScore(randomScore());
            event.setCommunicationImpactScore(randomScore());
            event.setPopularityScore(randomScore());
            events.add(event);
        }

        eventRepository.saveAll(events);
    }

    private static LocalDate randomFutureDate() {
        int daysAhead = ThreadLocalRandom.current().nextInt(MIN_DAYS_AHEAD, MAX_DAYS_AHEAD + 1);
        return LocalDate.now().plusDays(daysAhead);
    }

    private static int randomScore() {
        return ThreadLocalRandom.current().nextInt(1, 101);
    }

    private static <T> T randomFrom(List<T> values) {
        return values.get(ThreadLocalRandom.current().nextInt(values.size()));
    }

    private static <T extends Enum<T>> T randomEnum(Class<T> enumType) {
        T[] values = enumType.getEnumConstants();
        return values[ThreadLocalRandom.current().nextInt(values.length)];
    }

    private static Set<String> randomTags() {
        int count = ThreadLocalRandom.current().nextInt(2, 5);
        Set<String> selected = new HashSet<>();
        while (selected.size() < count) {
            selected.add(randomFrom(TAGS));
        }
        return selected;
    }
}

