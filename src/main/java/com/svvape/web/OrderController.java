package com.svvape.web;

import java.util.List;
import java.util.Map;

import com.svvape.order.CreateOrderRequest;
import com.svvape.order.OrderNotFoundException;
import com.svvape.order.OrderResult;
import com.svvape.order.OrderService;
import com.svvape.order.OrderValidationException;
import com.svvape.order.OrderView;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

	private final OrderService orderService;

	public OrderController(OrderService orderService) {
		this.orderService = orderService;
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> createOrder(@RequestBody CreateOrderRequest request) {
		OrderResult result = orderService.createOrder(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
				"message", "주문이 접수되었습니다.",
				"orderId", result.orderId(),
				"orderNo", result.orderNo(),
				"status", result.status(),
				"subtotalAmount", result.subtotalAmount(),
				"shippingFee", result.shippingFee(),
				"totalAmount", result.totalAmount()
		));
	}

	@GetMapping("/mine")
	public ResponseEntity<List<OrderView>> myOrders(@RequestParam long memberId) {
		return ResponseEntity.ok(orderService.findMemberOrders(memberId));
	}

	@GetMapping("/lookup")
	public ResponseEntity<OrderView> lookupGuestOrder(@RequestParam String orderNo, @RequestParam String phone) {
		return ResponseEntity.ok(orderService.findGuestOrder(orderNo, phone));
	}

	@ExceptionHandler(OrderValidationException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(OrderValidationException exception) {
		return ResponseEntity.badRequest().body(Map.of(
				"message", "입력값을 확인해 주세요.",
				"errors", exception.getErrors()
		));
	}

	@ExceptionHandler(OrderNotFoundException.class)
	public ResponseEntity<Map<String, Object>> handleNotFound(OrderNotFoundException exception) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
				"message", exception.getMessage()
		));
	}
}
