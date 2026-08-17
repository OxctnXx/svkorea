package com.svvape.member;

import java.time.LocalDate;

public record SignupRequest(
		String email,
		String password,
		String passwordConfirm,
		String name,
		String phone,
		String gender,
		String postcode,
		String addressLine1,
		String addressLine2,
		LocalDate birthDate,
		boolean termsAccepted,
		boolean marketingAgreed
) {
}
