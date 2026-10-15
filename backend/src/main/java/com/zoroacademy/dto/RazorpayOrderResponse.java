package com.zoroacademy.dto;

public class RazorpayOrderResponse {
    private String orderId;
    private Long amount;
    private String currency;
    private String keyId;
    private String registrationId;
    private boolean free;

    public RazorpayOrderResponse() {}

    public RazorpayOrderResponse(String orderId, Long amount, String currency, String keyId, String registrationId, boolean free) {
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.keyId = keyId;
        this.registrationId = registrationId;
        this.free = free;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private Long amount;
        private String currency = "INR";
        private String keyId;
        private String registrationId;
        private boolean free = false;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }
        public Builder amount(Long amount) {
            this.amount = amount;
            return this;
        }
        public Builder currency(String currency) {
            this.currency = currency;
            return this;
        }
        public Builder keyId(String keyId) {
            this.keyId = keyId;
            return this;
        }
        public Builder registrationId(String registrationId) {
            this.registrationId = registrationId;
            return this;
        }
        public Builder free(boolean free) {
            this.free = free;
            return this;
        }
        public RazorpayOrderResponse build() {
            return new RazorpayOrderResponse(orderId, amount, currency, keyId, registrationId, free);
        }
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public String getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(String registrationId) {
        this.registrationId = registrationId;
    }

    public boolean isFree() {
        return free;
    }

    public void setFree(boolean free) {
        this.free = free;
    }
}
