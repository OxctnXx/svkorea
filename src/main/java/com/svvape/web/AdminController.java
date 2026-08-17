package com.svvape.web;

import java.util.List;
import java.util.Map;

import com.svvape.admin.AdminAuthService;
import com.svvape.admin.AdminAuthenticationException;
import com.svvape.admin.AdminDashboardRepository;
import com.svvape.admin.AdminDashboardSummary;
import com.svvape.admin.AdminMemberView;
import com.svvape.admin.AdminOrderView;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private static final String AUTHENTICATE_HEADER = "Basic realm=\"SV Korea Dashboard\"";

	private final AdminAuthService adminAuthService;
	private final AdminDashboardRepository adminDashboardRepository;

	public AdminController(AdminAuthService adminAuthService, AdminDashboardRepository adminDashboardRepository) {
		this.adminAuthService = adminAuthService;
		this.adminDashboardRepository = adminDashboardRepository;
	}

	@GetMapping("/session")
	public ResponseEntity<Map<String, Object>> session(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
		adminAuthService.requireAuthorized(authorization);

		return ResponseEntity.ok(Map.of(
				"authenticated", true,
				"message", "관리자 로그인이 확인되었습니다."
		));
	}

	@GetMapping("/summary")
	public ResponseEntity<AdminDashboardSummary> summary(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
		adminAuthService.requireAuthorized(authorization);

		return ResponseEntity.ok(adminDashboardRepository.summary());
	}

	@GetMapping("/orders")
	public ResponseEntity<List<AdminOrderView>> orders(
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
			@RequestParam(defaultValue = "") String query,
			@RequestParam(defaultValue = "100") int limit) {
		adminAuthService.requireAuthorized(authorization);

		return ResponseEntity.ok(adminDashboardRepository.findOrders(query, limit));
	}

	@GetMapping("/orders/{orderNo}")
	public ResponseEntity<AdminOrderView> order(
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
			@PathVariable String orderNo) {
		adminAuthService.requireAuthorized(authorization);

		return adminDashboardRepository.findOrder(orderNo)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@GetMapping("/members")
	public ResponseEntity<List<AdminMemberView>> members(
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
			@RequestParam(defaultValue = "") String query,
			@RequestParam(defaultValue = "100") int limit) {
		adminAuthService.requireAuthorized(authorization);

		return ResponseEntity.ok(adminDashboardRepository.findMembers(query, limit));
	}

	@ExceptionHandler(AdminAuthenticationException.class)
	public ResponseEntity<Map<String, Object>> handleAdminAuthentication(AdminAuthenticationException exception) {
		return ResponseEntity.status(exception.getStatus())
				.header(HttpHeaders.WWW_AUTHENTICATE, AUTHENTICATE_HEADER)
				.body(Map.of(
						"message", exception.getMessage(),
						"status", exception.getStatus().value()
				));
	}
}
