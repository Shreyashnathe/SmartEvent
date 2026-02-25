package com.smartevent.controller;

import com.smartevent.dto.ChangePasswordRequest;
import com.smartevent.dto.UserMeResponse;
import com.smartevent.dto.UserPreferenceRequest;
import com.smartevent.dto.UserBookmarkResponse;
import com.smartevent.service.UserService;
import com.smartevent.service.UserBookmarkService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserBookmarkService userBookmarkService;

    public UserController(UserService userService, UserBookmarkService userBookmarkService) {
        this.userService = userService;
        this.userBookmarkService = userBookmarkService;
    }

    @GetMapping("/me")
    public UserMeResponse getCurrentUser() {
        return userService.getCurrentUserProfile();
    }

    @PutMapping("/preferences")
    public UserMeResponse updatePreferences(@Valid @RequestBody UserPreferenceRequest request) {
        return userService.updatePreferences(request);
    }

    @PutMapping("/change-password")
    public Map<String, String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return Map.of("message", "Password updated successfully");
    }

    @PostMapping("/bookmarks/{eventId}")
    public void addBookmark(@PathVariable String eventId) {
        userBookmarkService.addBookmark(eventId);
    }

    @DeleteMapping("/bookmarks/{eventId}")
    public void removeBookmark(@PathVariable String eventId) {
        userBookmarkService.removeBookmark(eventId);
    }

    @GetMapping("/bookmarks")
    public java.util.List<UserBookmarkResponse> getBookmarks() {
        return userBookmarkService.getBookmarks();
    }
}
