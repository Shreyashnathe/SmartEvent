package com.smartevent.controller;

import com.smartevent.dto.ChangePasswordRequest;
import com.smartevent.dto.UserMeResponse;
import com.smartevent.dto.UserPreferenceRequest;
import com.smartevent.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
}
