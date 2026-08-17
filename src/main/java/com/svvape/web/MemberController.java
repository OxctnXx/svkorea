package com.svvape.web;

import java.util.Map;

import com.svvape.member.AuthenticationFailedException;
import com.svvape.member.DuplicateMemberException;
import com.svvape.member.LoginRequest;
import com.svvape.member.LoginResult;
import com.svvape.member.MemberService;
import com.svvape.member.SignupRequest;
import com.svvape.member.SignupResult;
import com.svvape.member.SignupValidationException;

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
@RequestMapping("/api/members")
public class MemberController {

	private final MemberService memberService;

	public MemberController(MemberService memberService) {
		this.memberService = memberService;
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> signup(@RequestBody SignupRequest request) {
		SignupResult result = memberService.signup(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
				"message", "회원가입이 완료되었습니다.",
				"memberId", result.memberId(),
				"email", result.email(),
				"name", result.name()
		));
	}

	@PostMapping("/login")
	public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
		LoginResult result = memberService.login(request);

		return ResponseEntity.ok(Map.of(
				"message", "로그인이 완료되었습니다.",
				"memberId", result.memberId(),
				"email", result.email(),
				"name", result.name()
		));
	}

	@GetMapping("/email-availability")
	public ResponseEntity<Map<String, Object>> checkEmailAvailability(@RequestParam String email) {
		boolean available = memberService.isEmailAvailable(email);

		return ResponseEntity.ok(Map.of(
				"available", available,
				"message", available ? "사용 가능한 이메일입니다." : "이미 가입된 이메일입니다."
		));
	}

	@ExceptionHandler(SignupValidationException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(SignupValidationException exception) {
		return ResponseEntity.badRequest().body(Map.of(
				"message", "입력값을 확인해 주세요.",
				"errors", exception.getErrors()
		));
	}

	@ExceptionHandler(DuplicateMemberException.class)
	public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateMemberException exception) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
				"message", exception.getMessage()
		));
	}

	@ExceptionHandler(AuthenticationFailedException.class)
	public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationFailedException exception) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
				"message", exception.getMessage()
		));
	}
}
