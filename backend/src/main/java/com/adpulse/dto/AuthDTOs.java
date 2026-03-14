package com.adpulse.dto;

public class AuthDTOs {

    public record LoginRequest(String username, String password) {}

    public record LoginResponse(String token, String username, String role, long expiresIn) {}

    public record RegisterRequest(String username, String password, String role) {}

    public record MessageResponse(String message) {}
}
