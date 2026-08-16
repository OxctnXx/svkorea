package com.svvape.member;

public record LoginResult(
		long memberId,
		String email,
		String name
) {
}
