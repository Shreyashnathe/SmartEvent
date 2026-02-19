package com.smartevent.repository;

import com.smartevent.entity.Interaction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InteractionRepository extends JpaRepository<Interaction, UUID> {

    List<Interaction> findByUserId(UUID userId);
}

