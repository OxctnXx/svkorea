package com.svvape.order;

import java.util.List;

public record CreateOrderRequest(
		Long memberId,
		String recipient,
		String email,
		String phone,
		String address,
		String memo,
		String paymentMethod,
		boolean adultConfirmed,
		List<OrderItemRequest> items
) {
}
