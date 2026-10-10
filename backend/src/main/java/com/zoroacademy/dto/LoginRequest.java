package com.zoroacademy.dto;

public class LoginRequest {
    private String email;
    private String username;
    private String password;
    private Boolean rememberMe;

    public LoginRequest() {}

    public LoginRequest(String email, String username, String password) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.rememberMe = false;
    }

    public LoginRequest(String email, String username, String password, Boolean rememberMe) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.rememberMe = rememberMe;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getRememberMe() { return rememberMe; }
    public void setRememberMe(Boolean rememberMe) { this.rememberMe = rememberMe; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String email;
        private String username;
        private String password;
        private Boolean rememberMe;

        public Builder email(String email) { this.email = email; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder rememberMe(Boolean rememberMe) { this.rememberMe = rememberMe; return this; }

        public LoginRequest build() {
            return new LoginRequest(email, username, password, rememberMe);
        }
    }
}
