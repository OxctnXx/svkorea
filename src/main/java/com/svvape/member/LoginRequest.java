package com.svvape.member;

public record LoginRequest(
		String email,
		String password,
		boolean keepSignedIn
) {
}
