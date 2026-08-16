package com.svvape.web;

import java.util.Map;

import com.svvape.member.DuplicateMemberException;
import com.svvape.member.MemberService;
import com.svvape.member.SignupRequest;
import com.svvape.member.SignupResult;
import com.svvape.member.SignupValidationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
