package com.svvape.order;

public record OrderItemRequest(
		String name,
		String option,
		long price,
		int quantity
) {
}
