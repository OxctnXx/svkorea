package com.svvape.member;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

	private final MemberRepository memberRepository;
	private final PasswordHasher passwordHasher;

	public MemberService(MemberRepository memberRepository, PasswordHasher passwordHasher) {
		this.memberRepository = memberRepository;
		this.passwordHasher = passwordHasher;
	}

	public SignupResult signup(SignupRequest request) {
		SignupMember member = validate(request);

		if (memberRepository.existsByEmail(member.email())) {
			throw new DuplicateMemberException("이미 가입된 이메일입니다.");
		}

		String passwordHash = passwordHasher.hash(member.password());
		try {
			long memberId = memberRepository.save(member, passwordHash);
			return new SignupResult(memberId, member.email(), member.name());
		}
		catch (DuplicateKeyException exception) {
			throw new DuplicateMemberException("이미 가입된 이메일입니다.");
		}
	}

	public LoginResult login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		String password = trimToEmpty(request.password());

		if (email.isBlank() || password.isBlank()) {
			throw new AuthenticationFailedException("이메일 또는 비밀번호를 확인해 주세요.");
		}

		MemberAccount account = memberRepository.findByEmail(email)
				.orElseThrow(() -> new AuthenticationFailedException("이메일 또는 비밀번호를 확인해 주세요."));

		if (!"ACTIVE".equalsIgnoreCase(account.status())) {
			throw new AuthenticationFailedException("이용할 수 없는 계정입니다.");
		}

		if (!passwordHasher.matches(password, account.passwordHash())) {
			throw new AuthenticationFailedException("이메일 또는 비밀번호를 확인해 주세요.");
		}

		return new LoginResult(account.id(), account.email(), account.name());
	}

	public boolean isEmailAvailable(String email) {
		String normalizedEmail = normalizeEmail(email);
		if (normalizedEmail.isBlank() || !EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
			throw new SignupValidationException(List.of("사용할 수 있는 이메일 주소를 입력해 주세요."));
		}

		return !memberRepository.existsByEmail(normalizedEmail);
	}

	private SignupMember validate(SignupRequest request) {
		List<String> errors = new ArrayList<>();

		String email = normalizeEmail(request.email());
		String password = trimToEmpty(request.password());
		String passwordConfirm = trimToEmpty(request.passwordConfirm());
		String name = trimToEmpty(request.name());
		String phone = normalizePhone(request.phone());
		String gender = trimToEmpty(request.gender());
		LocalDate birthDate = request.birthDate();

		if (email.isBlank() || !EMAIL_PATTERN.matcher(email).matches()) {
			errors.add("사용할 수 있는 이메일 주소를 입력해 주세요.");
		}
		if (password.length() < 8) {
			errors.add("비밀번호는 8자 이상으로 입력해 주세요.");
		}
		if (!password.equals(passwordConfirm)) {
			errors.add("비밀번호 확인이 일치하지 않습니다.");
		}
		if (name.isBlank()) {
			errors.add("이름을 입력해 주세요.");
		}
		if (gender.isBlank()) {
			errors.add("성별을 선택해 주세요.");
		}
		if (birthDate == null) {
			errors.add("생년월일을 입력해 주세요.");
		}
		else if (birthDate.isAfter(LocalDate.now().minusYears(19))) {
			errors.add("성인 회원만 가입할 수 있습니다.");
		}
		if (!request.termsAccepted()) {
			errors.add("필수 약관에 동의해 주세요.");
		}

		if (!errors.isEmpty()) {
			throw new SignupValidationException(errors);
		}

		return new SignupMember(
				email,
				password,
				name,
				phone,
				birthDate,
				true,
				request.termsAccepted(),
				request.marketingAgreed()
		);
	}

	private String normalizeEmail(String value) {
		return trimToEmpty(value).toLowerCase(Locale.ROOT);
	}

	private String normalizePhone(String value) {
		String phone = trimToEmpty(value);
		return phone.isBlank() ? null : phone;
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}
}
