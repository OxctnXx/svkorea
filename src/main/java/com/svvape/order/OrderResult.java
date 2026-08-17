package com.svvape.order;

public record OrderResult(
		long orderId,
		String orderNo,
		String status,
		long subtotalAmount,
		long shippingFee,
		long totalAmount
) {
}
