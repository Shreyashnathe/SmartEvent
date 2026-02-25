package com.smartevent.service;

import com.smartevent.dto.UserBookmarkResponse;
import com.smartevent.entity.User;
import com.smartevent.entity.UserBookmark;
import com.smartevent.repository.UserBookmarkRepository;
import com.smartevent.repository.UserRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserBookmarkService {

    private static final Logger logger = LoggerFactory.getLogger(UserBookmarkService.class);

    private final UserRepository userRepository;
    private final UserBookmarkRepository userBookmarkRepository;

    public UserBookmarkService(UserRepository userRepository, UserBookmarkRepository userBookmarkRepository) {
        this.userRepository = userRepository;
        this.userBookmarkRepository = userBookmarkRepository;
    }

    @Transactional
    public void addBookmark(String eventId) {
        User user = getAuthenticatedUser();

        if (eventId == null || eventId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "eventId is required");
        }

        if (userBookmarkRepository.existsByUserAndEventId(user, eventId.trim())) {
            return;
        }

        UserBookmark bookmark = new UserBookmark();
        bookmark.setUser(user);
        bookmark.setEventId(eventId.trim());
        userBookmarkRepository.save(bookmark);
    }

    @Transactional
    public void removeBookmark(String eventId) {
        User user = getAuthenticatedUser();

        if (eventId == null || eventId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "eventId is required");
        }

        userBookmarkRepository.deleteByUserAndEventId(user, eventId.trim());
    }

    @Transactional(readOnly = true)
    public List<UserBookmarkResponse> getBookmarks() {
        User user = getAuthenticatedUser();

        return userBookmarkRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(bookmark -> new UserBookmarkResponse(bookmark.getEventId(), bookmark.getCreatedAt()))
                .toList();
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        String email = authentication.getName();
        logger.info("Authenticated user email: {}", email);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }
}

