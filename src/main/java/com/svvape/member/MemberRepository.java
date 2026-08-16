package com.svvape.member;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class MemberRepository {

	private final JdbcTemplate jdbcTemplate;

	public MemberRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public boolean existsByEmail(String email) {
		Integer count = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM members WHERE email = ?",
				Integer.class,
				email
		);
		return count != null && count > 0;
	}

	public Optional<MemberAccount> findByEmail(String email) {
		String sql = """
				SELECT id, email, password_hash, name, status
				FROM members
				WHERE email = ?
				""";

		try {
			return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (resultSet, rowNumber) -> new MemberAccount(
					resultSet.getLong("id"),
					resultSet.getString("email"),
					resultSet.getString("password_hash"),
					resultSet.getString("name"),
					resultSet.getString("status")
			), email));
		}
		catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public long save(SignupMember member, String passwordHash) {
		String sql = """
				INSERT INTO members (
				  email,
				  password_hash,
				  name,
				  phone,
				  birth_date,
				  adult_confirmed,
				  terms_accepted,
				  marketing_agreed
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				""";
		KeyHolder keyHolder = new GeneratedKeyHolder();

		jdbcTemplate.update(connection -> {
			PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
			statement.setString(1, member.email());
			statement.setString(2, passwordHash);
			statement.setString(3, member.name());
			statement.setString(4, member.phone());
			statement.setDate(5, Date.valueOf(member.birthDate()));
			statement.setBoolean(6, member.adultConfirmed());
			statement.setBoolean(7, member.termsAccepted());
			statement.setBoolean(8, member.marketingAgreed());
			return statement;
		}, keyHolder);

		Number key = keyHolder.getKey();
		if (key == null) {
			throw new IllegalStateException("Member was saved but generated id was not returned");
		}
		return key.longValue();
	}
}
