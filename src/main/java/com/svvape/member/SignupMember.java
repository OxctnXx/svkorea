package com.svvape.member;

import java.time.LocalDate;

record SignupMember(
		String email,
		String password,
		String name,
		String phone,
		LocalDate birthDate,
		boolean adultConfirmed,
		boolean termsAccepted,
		boolean marketingAgreed
) {
}
