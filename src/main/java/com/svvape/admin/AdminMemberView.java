package com.svvape.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminMemberView(
		long id,
		String email,
		String name,
		String phone,
		LocalDate birthDate,
		boolean adultConfirmed,
		boolean termsAccepted,
		boolean marketingAgreed,
		String status,
		LocalDateTime createdAt
) {
}
