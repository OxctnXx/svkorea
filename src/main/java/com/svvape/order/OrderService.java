package com.svvape.order;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

	private static final long FREE_SHIPPING_THRESHOLD = 50_000;
	private static final long SHIPPING_FEE = 3_000;
	private static final SecureRandom RANDOM = new SecureRandom();

	private final OrderRepository orderRepository;

	public OrderService(OrderRepository orderRepository) {
		this.orderRepository = orderRepository;
	}

	@Transactional
	public OrderResult createOrder(CreateOrderRequest request) {
		validate(request);

		long subtotal = request.items().stream()
				.mapToLong(item -> item.price() * item.quantity())
				.sum();
		long shippingFee = subtotal == 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
		long total = subtotal + shippingFee;

		String orderNo = generateOrderNo();
		String orderType = request.memberId() != null ? "MEMBER" : "GUEST";

		long orderId = orderRepository.insertOrder(orderNo, request.memberId(), orderType, request, subtotal, shippingFee, total);
		orderRepository.insertItems(orderId, request.items());

		return new OrderResult(orderId, orderNo, "RECEIVED", subtotal, shippingFee, total);
	}

	public List<OrderView> findMemberOrders(long memberId) {
		return orderRepository.findByMemberId(memberId);
	}

	public OrderView findGuestOrder(String orderNo, String phone) {
		return orderRepository.findByOrderNoAndPhone(trimToEmpty(orderNo), trimToEmpty(phone))
				.orElseThrow(() -> new OrderNotFoundException("주문번호와 전화번호가 일치하는 주문을 찾을 수 없습니다."));
	}

	private void validate(CreateOrderRequest request) {
		List<String> errors = new ArrayList<>();

		if (isBlank(request.recipient())) {
			errors.add("받는 분을 입력해 주세요.");
		}
		if (isBlank(request.email())) {
			errors.add("이메일을 입력해 주세요.");
		}
		if (isBlank(request.phone())) {
			errors.add("전화번호를 입력해 주세요.");
		}
		if (isBlank(request.address())) {
			errors.add("배송지를 입력해 주세요.");
		}
		if (isBlank(request.paymentMethod())) {
			errors.add("결제수단을 선택해 주세요.");
		}
		if (!request.adultConfirmed()) {
			errors.add("성인 구매 확인에 동의해 주세요.");
		}
		if (request.items() == null || request.items().isEmpty()) {
			errors.add("주문할 상품이 없습니다.");
		}
		else if (request.items().stream().anyMatch(item -> item.quantity() <= 0 || item.price() < 0 || isBlank(item.name()))) {
			errors.add("상품 정보가 올바르지 않습니다.");
		}

		if (!errors.isEmpty()) {
			throw new OrderValidationException(errors);
		}
	}

	private String generateOrderNo() {
		String candidate;
		int attempts = 0;
		do {
			String timestampPart = Long.toString(Instant.now().toEpochMilli(), 36).toUpperCase(Locale.ROOT);
			String randomPart = Integer.toString(RANDOM.nextInt(36 * 36), 36).toUpperCase(Locale.ROOT);
			candidate = "SV-" + timestampPart + randomPart;
			attempts++;
		}
		while (orderRepository.existsByOrderNo(candidate) && attempts < 5);
		return candidate;
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}
}
