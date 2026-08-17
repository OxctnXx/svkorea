package com.svvape.order;

import java.time.LocalDateTime;
import java.util.List;

public record OrderView(
		long id,
		String orderNo,
		String status,
		String recipientName,
		String recipientPhone,
		String shippingAddress,
		String courierCompany,
		String trackingNo,
		long subtotalAmount,
		long shippingFee,
		long totalAmount,
		LocalDateTime createdAt,
		List<OrderItemView> items
) {
}
