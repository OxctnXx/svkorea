package com.svvape.member;

public record MemberAccount(
		long id,
		String email,
		String passwordHash,
		String name,
		String status
) {
}
