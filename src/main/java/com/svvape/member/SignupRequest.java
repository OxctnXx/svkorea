package com.svvape.member;

import java.time.LocalDate;

public record SignupRequest(
		String email,
		String password,
		String passwordConfirm,
		String name,
		String phone,
		LocalDate birthDate,
		boolean adultConfirmed,
		boolean termsAccepted,
		boolean marketingAgreed
) {
}
