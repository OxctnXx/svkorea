package com.svvape.member;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

	private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
	private static final int ITERATIONS = 310_000;
	private static final int KEY_LENGTH = 256;
	private static final int SALT_LENGTH = 16;

	private final SecureRandom secureRandom = new SecureRandom();

	public String hash(String password) {
		byte[] salt = new byte[SALT_LENGTH];
		secureRandom.nextBytes(salt);
		byte[] hash = pbkdf2(password.toCharArray(), salt);

		return "pbkdf2_sha256$"
				+ ITERATIONS
				+ "$"
				+ Base64.getEncoder().encodeToString(salt)
				+ "$"
				+ Base64.getEncoder().encodeToString(hash);
	}

	public boolean matches(String password, String encodedPassword) {
		if (password == null || encodedPassword == null) {
			return false;
		}

		String[] parts = encodedPassword.split("\\$");
		if (parts.length != 4 || !"pbkdf2_sha256".equals(parts[0])) {
			return false;
		}

		try {
			int iterations = Integer.parseInt(parts[1]);
			byte[] salt = Base64.getDecoder().decode(parts[2]);
			byte[] expectedHash = Base64.getDecoder().decode(parts[3]);
			byte[] actualHash = pbkdf2(password.toCharArray(), salt, iterations);
			return MessageDigest.isEqual(expectedHash, actualHash);
		}
		catch (IllegalArgumentException exception) {
			return false;
		}
	}

	private byte[] pbkdf2(char[] password, byte[] salt) {
		return pbkdf2(password, salt, ITERATIONS);
	}

	private byte[] pbkdf2(char[] password, byte[] salt, int iterations) {
		try {
			PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, KEY_LENGTH);
			return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).getEncoded();
		}
		catch (NoSuchAlgorithmException | InvalidKeySpecException exception) {
			throw new IllegalStateException("Could not hash password", exception);
		}
	}
}
