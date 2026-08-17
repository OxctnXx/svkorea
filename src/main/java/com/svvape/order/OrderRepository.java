package com.svvape.order;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class OrderRepository {

	private final JdbcTemplate jdbcTemplate;

	public OrderRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public boolean existsByOrderNo(String orderNo) {
		Integer count = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM orders WHERE order_no = ?",
				Integer.class,
				orderNo
		);
		return count != null && count > 0;
	}

	public long insertOrder(String orderNo, Long memberId, String orderType, CreateOrderRequest request,
			long subtotal, long shippingFee, long total) {
		String sql = """
				INSERT INTO orders (
				  order_no, member_id, order_type, recipient_name, recipient_phone,
				  recipient_email, shipping_address, shipping_memo, payment_method,
				  subtotal_amount, shipping_fee, total_amount, adult_confirmed
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				""";
		KeyHolder keyHolder = new GeneratedKeyHolder();

		jdbcTemplate.update(connection -> {
			PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
			statement.setString(1, orderNo);
			if (memberId != null) {
				statement.setLong(2, memberId);
			}
			else {
				statement.setNull(2, java.sql.Types.BIGINT);
			}
			statement.setString(3, orderType);
			statement.setString(4, request.recipient());
			statement.setString(5, request.phone());
			statement.setString(6, request.email());
			statement.setString(7, request.address());
			statement.setString(8, request.memo());
			statement.setString(9, request.paymentMethod());
			statement.setLong(10, subtotal);
			statement.setLong(11, shippingFee);
			statement.setLong(12, total);
			statement.setBoolean(13, request.adultConfirmed());
			return statement;
		}, keyHolder);

		Number key = keyHolder.getKey();
		if (key == null) {
			throw new IllegalStateException("Order was saved but generated id was not returned");
		}
		return key.longValue();
	}

	public void insertItems(long orderId, List<OrderItemRequest> items) {
		String sql = """
				INSERT INTO order_items (order_id, product_name, option_name, unit_price, quantity, line_total)
				VALUES (?, ?, ?, ?, ?, ?)
				""";
		jdbcTemplate.batchUpdate(sql, items, items.size(), (ps, item) -> {
			ps.setLong(1, orderId);
			ps.setString(2, item.name());
			ps.setString(3, item.option());
			ps.setLong(4, item.price());
			ps.setInt(5, item.quantity());
			ps.setLong(6, item.price() * item.quantity());
		});
	}

	public List<OrderView> findByMemberId(long memberId) {
		String sql = """
				SELECT id, order_no, status, recipient_name, recipient_phone, shipping_address,
				       courier_company, tracking_no, subtotal_amount, shipping_fee, total_amount, created_at
				FROM orders
				WHERE member_id = ?
				ORDER BY created_at DESC
				""";
		List<OrderRow> rows = jdbcTemplate.query(sql, rowMapper(), memberId);
		return attachItems(rows);
	}

	public Optional<OrderView> findByOrderNoAndPhone(String orderNo, String phone) {
		String sql = """
				SELECT id, order_no, status, recipient_name, recipient_phone, shipping_address,
				       courier_company, tracking_no, subtotal_amount, shipping_fee, total_amount, created_at
				FROM orders
				WHERE order_no = ? AND recipient_phone = ?
				""";
		try {
			OrderRow row = jdbcTemplate.queryForObject(sql, rowMapper(), orderNo, phone);
			if (row == null) {
				return Optional.empty();
			}
			return Optional.of(attachItems(List.of(row)).get(0));
		}
		catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	private List<OrderView> attachItems(List<OrderRow> rows) {
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
			return new OrderView(
					row.id(), row.orderNo(), row.status(), row.recipientName(), row.recipientPhone(),
					row.shippingAddress(), row.courierCompany(), row.trackingNo(),
					row.subtotalAmount(), row.shippingFee(), row.totalAmount(), row.createdAt(), items
			);
		}).toList();
	}

	private RowMapper<OrderRow> rowMapper() {
		return (rs, rowNum) -> new OrderRow(
				rs.getLong("id"),
				rs.getString("order_no"),
				rs.getString("status"),
				rs.getString("recipient_name"),
				rs.getString("recipient_phone"),
				rs.getString("shipping_address"),
				rs.getString("courier_company"),
				rs.getString("tracking_no"),
				rs.getLong("subtotal_amount"),
				rs.getLong("shipping_fee"),
				rs.getLong("total_amount"),
				toLocalDateTime(rs.getTimestamp("created_at"))
		);
	}

	private LocalDateTime toLocalDateTime(Timestamp timestamp) {
		return timestamp == null ? null : timestamp.toLocalDateTime();
	}

	private record OrderRow(
			long id, String orderNo, String status, String recipientName, String recipientPhone,
			String shippingAddress, String courierCompany, String trackingNo,
			long subtotalAmount, long shippingFee, long totalAmount, LocalDateTime createdAt
	) {
	}
}
