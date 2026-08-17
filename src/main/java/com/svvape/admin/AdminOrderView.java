package com.svvape.admin;

import java.time.LocalDateTime;
import java.util.List;

import com.svvape.order.OrderItemView;

public record AdminOrderView(
		long id,
		String orderNo,
		String status,
		String orderType,
		String recipientName,
		String recipientPhone,
		String recipientEmail,
		String shippingAddress,
		String shippingMemo,
		String paymentMethod,
		long subtotalAmount,
		long shippingFee,
		long totalAmount,
		String courierCompany,
		String trackingNo,
		LocalDateTime createdAt,
		String memberEmail,
		String memberName,
		List<OrderItemView> items
) {
}
