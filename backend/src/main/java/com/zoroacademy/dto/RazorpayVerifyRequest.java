package com.zoroacademy.dto;

import jakarta.validation.constraints.NotBlank;

public class RazorpayVerifyRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotBlank(message = "Payment ID is required")
    private String paymentId;

    @NotBlank(message = "Signature is required")
    private String signature;

    public RazorpayVerifyRequest() {}

    public RazorpayVerifyRequest(String orderId, String paymentId, String signature) {
        this.orderId = orderId;
        this.paymentId = paymentId;
        this.signature = signature;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }
}
