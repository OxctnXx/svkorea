package com.svvape.admin;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.svvape.order.OrderItemView;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class AdminDashboardRepository {

	private final JdbcTemplate jdbcTemplate;

	public AdminDashboardRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public AdminDashboardSummary summary() {
		String sql = """
				SELECT
				  (SELECT COUNT(*) FROM orders) AS total_orders,
				  (SELECT COUNT(*) FROM orders WHERE status = 'RECEIVED') AS received_orders,
				  (SELECT COUNT(*) FROM members) AS total_members,
				  COALESCE((SELECT SUM(total_amount) FROM orders), 0) AS total_revenue,
				  (SELECT MAX(created_at) FROM orders) AS latest_order_at
				""";

		return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new AdminDashboardSummary(
				rs.getLong("total_orders"),
				rs.getLong("received_orders"),
				rs.getLong("total_members"),
				rs.getLong("total_revenue"),
				toLocalDateTime(rs.getTimestamp("latest_order_at"))
		));
	}

	public List<AdminOrderView> findOrders(String query, int limit) {
		String normalizedQuery = normalize(query);
		String likeQuery = "%" + normalizedQuery + "%";
		String sql = """
				SELECT o.id, o.order_no, o.status, o.order_type, o.recipient_name, o.recipient_phone,
				       o.recipient_email, o.shipping_address, o.shipping_memo, o.payment_method,
				       o.subtotal_amount, o.shipping_fee, o.total_amount, o.courier_company,
				       o.tracking_no, o.created_at, m.email AS member_email, m.name AS member_name
				FROM orders o
				LEFT JOIN members m ON m.id = o.member_id
				WHERE (? = ''
				       OR o.order_no LIKE ?
				       OR o.recipient_name LIKE ?
				       OR o.recipient_phone LIKE ?
				       OR o.recipient_email LIKE ?
				       OR m.email LIKE ?
				       OR m.name LIKE ?)
				ORDER BY o.created_at DESC
				LIMIT ?
				""";

		List<AdminOrderRow> rows = jdbcTemplate.query(
				sql,
				orderRowMapper(),
				normalizedQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, sanitizeLimit(limit)
		);
		return attachItems(rows);
	}

	public Optional<AdminOrderView> findOrder(String orderNo) {
		String sql = """
				SELECT o.id, o.order_no, o.status, o.order_type, o.recipient_name, o.recipient_phone,
				       o.recipient_email, o.shipping_address, o.shipping_memo, o.payment_method,
				       o.subtotal_amount, o.shipping_fee, o.total_amount, o.courier_company,
				       o.tracking_no, o.created_at, m.email AS member_email, m.name AS member_name
				FROM orders o
				LEFT JOIN members m ON m.id = o.member_id
				WHERE o.order_no = ?
				""";

		try {
			AdminOrderRow row = jdbcTemplate.queryForObject(sql, orderRowMapper(), orderNo);
			return row == null ? Optional.empty() : Optional.of(attachItems(List.of(row)).get(0));
		}
		catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public List<AdminMemberView> findMembers(String query, int limit) {
		String normalizedQuery = normalize(query);
		String likeQuery = "%" + normalizedQuery + "%";
		String sql = """
				SELECT id, email, name, phone, birth_date, adult_confirmed, terms_accepted,
				       marketing_agreed, status, created_at
				FROM members
				WHERE (? = ''
				       OR email LIKE ?
				       OR name LIKE ?
				       OR phone LIKE ?)
				ORDER BY created_at DESC
				LIMIT ?
				""";

		return jdbcTemplate.query(
				sql,
				(rs, rowNum) -> new AdminMemberView(
						rs.getLong("id"),
						rs.getString("email"),
						rs.getString("name"),
						rs.getString("phone"),
						toLocalDate(rs.getDate("birth_date")),
						rs.getBoolean("adult_confirmed"),
						rs.getBoolean("terms_accepted"),
						rs.getBoolean("marketing_agreed"),
						rs.getString("status"),
						toLocalDateTime(rs.getTimestamp("created_at"))
				),
				normalizedQuery, likeQuery, likeQuery, likeQuery, sanitizeLimit(limit)
		);
	}

	private List<AdminOrderView> attachItems(List<AdminOrderRow> rows) {
		return rows.stream().map(row -> {
			List<OrderItemView> items = jdbcTemplate.query(
					"SELECT product_name, option_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ?",
					(rs, rowNum) -> new OrderItemView(
							rs.getString("product_name"),
							rs.getString("option_name"),
							rs.getLong("unit_price"),
							rs.getInt("quantity"),
							rs.getLong("line_total")
					),
					row.id()
			);
			return new AdminOrderView(
					row.id(), row.orderNo(), row.status(), row.orderType(), row.recipientName(), row.recipientPhone(),
					row.recipientEmail(), row.shippingAddress(), row.shippingMemo(), row.paymentMethod(),
					row.subtotalAmount(), row.shippingFee(), row.totalAmount(), row.courierCompany(),
					row.trackingNo(), row.createdAt(), row.memberEmail(), row.memberName(), items
			);
		}).toList();
	}

	private RowMapper<AdminOrderRow> orderRowMapper() {
		return (rs, rowNum) -> new AdminOrderRow(
				rs.getLong("id"),
				rs.getString("order_no"),
				rs.getString("status"),
				rs.getString("order_type"),
				rs.getString("recipient_name"),
				rs.getString("recipient_phone"),
				rs.getString("recipient_email"),
				rs.getString("shipping_address"),
				rs.getString("shipping_memo"),
				rs.getString("payment_method"),
				rs.getLong("subtotal_amount"),
				rs.getLong("shipping_fee"),
				rs.getLong("total_amount"),
				rs.getString("courier_company"),
				rs.getString("tracking_no"),
				toLocalDateTime(rs.getTimestamp("created_at")),
				rs.getString("member_email"),
				rs.getString("member_name")
		);
	}

	private String normalize(String query) {
		return query == null ? "" : query.trim();
	}

	private int sanitizeLimit(int limit) {
		if (limit <= 0) {
			return 100;
		}
		return Math.min(limit, 500);
	}

	private LocalDate toLocalDate(Date date) {
		return date == null ? null : date.toLocalDate();
	}

	private LocalDateTime toLocalDateTime(Timestamp timestamp) {
		return timestamp == null ? null : timestamp.toLocalDateTime();
	}

	private record AdminOrderRow(
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
			String memberName
	) {
	}
}
