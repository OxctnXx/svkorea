package com.svvape.admin;

import java.time.LocalDateTime;

public record AdminDashboardSummary(
		long totalOrders,
		long receivedOrders,
		long totalMembers,
		long totalRevenue,
		LocalDateTime latestOrderAt
) {
}
