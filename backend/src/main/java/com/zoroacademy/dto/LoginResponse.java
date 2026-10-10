package com.zoroacademy.dto;

public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String token;
    private String tokenType = "Bearer";
    private UserDto user;

    public LoginResponse() {}

    public LoginResponse(String accessToken, String refreshToken, String tokenType, UserDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.token = accessToken;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
        if (this.token == null) {
            this.token = accessToken;
        }
    }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getToken() { return token; }
    public void setToken(String token) {
        this.token = token;
        if (this.accessToken == null) {
            this.accessToken = token;
        }
    }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String accessToken;
        private String refreshToken;
        private String token;
        private String tokenType = "Bearer";
        private UserDto user;

        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            if (this.token == null) {
                this.token = accessToken;
            }
            return this;
        }

        public Builder refreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        public Builder token(String token) {
            this.token = token;
            if (this.accessToken == null) {
                this.accessToken = token;
            }
            return this;
        }

        public Builder tokenType(String tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public Builder user(UserDto user) {
            this.user = user;
            return this;
        }

        public LoginResponse build() {
            String effAccess = accessToken != null ? accessToken : token;
            return new LoginResponse(effAccess, refreshToken, tokenType, user);
        }
    }
}
