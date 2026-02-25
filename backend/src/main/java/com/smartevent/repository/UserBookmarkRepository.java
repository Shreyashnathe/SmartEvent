package com.smartevent.repository;

import com.smartevent.entity.User;
import com.smartevent.entity.UserBookmark;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBookmarkRepository extends JpaRepository<UserBookmark, UUID> {

    Optional<UserBookmark> findByUserAndEventId(User user, String eventId);

    List<UserBookmark> findAllByUserOrderByCreatedAtDesc(User user);

    void deleteByUserAndEventId(User user, String eventId);

    boolean existsByUserAndEventId(User user, String eventId);
}

