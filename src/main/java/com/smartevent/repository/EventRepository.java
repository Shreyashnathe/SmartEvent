package com.smartevent.repository;

import com.smartevent.entity.Event;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, UUID> {

    List<Event> findByEventDateAfter(LocalDate eventDate);

    List<Event> findByLocation(String location);
}
