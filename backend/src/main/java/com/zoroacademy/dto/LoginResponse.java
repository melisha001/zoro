package com.zoroacademy.dto;

public class LoginResponse {
    private String token;
    private String tokenType;
    private UserDto user;

    public LoginResponse() {}

    public LoginResponse(String token, String tokenType, UserDto user) {
        this.token = token;
        this.tokenType = tokenType;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String token;
        private String tokenType;
        private UserDto user;

        public Builder token(String token) { this.token = token; return this; }
        public Builder tokenType(String tokenType) { this.tokenType = tokenType; return this; }
        public Builder user(UserDto user) { this.user = user; return this; }

        public LoginResponse build() {
            return new LoginResponse(token, tokenType, user);
        }
    }
}
