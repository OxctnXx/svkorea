package com.svvape.order;

public record OrderItemView(
		String name,
		String option,
		long price,
		int quantity,
		long lineTotal
) {
}
