(() => {
  const store = window.SVStore;
  const signupForm = document.querySelector("[data-signup-form]");
  const signupStatus = document.querySelector("[data-signup-status]");
  const identityVerifyButton = document.querySelector("[data-identity-verify]");
  const addressSearchButton = document.querySelector("[data-address-search]");
  const emailInput = document.querySelector("[data-email-input]");
  const emailCheckButton = document.querySelector("[data-email-check]");
  const emailCheckStatus = document.querySelector("[data-email-check-status]");
  const phoneInput = document.querySelector("[data-phone-input]");

  if (!signupForm || !store) {
    return;
  }

  const addressFields = {
    postcode: signupForm.querySelector("[data-postcode]"),
    addressLine1: signupForm.querySelector("[data-address-line1]"),
    addressLine2: signupForm.querySelector("[data-address-line2]"),
  };

  const formatPhoneNumber = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) {
      return digits;
    }
    if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const fillAddress = (data) => {
    const selectedAddress = data.address
      || (data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress)
      || data.roadAddress
      || data.jibunAddress
      || "";

    if (addressFields.postcode) {
      addressFields.postcode.value = data.zonecode ?? "";
    }
    if (addressFields.addressLine1) {
      addressFields.addressLine1.value = selectedAddress;
    }

    addressFields.addressLine2?.focus();
  };

  const readSignupForm = (form) => {
    const formData = new FormData(form);

    return {
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      phone: formatPhoneNumber(formData.get("phone")),
      gender: String(formData.get("gender") ?? ""),
      postcode: String(formData.get("postcode") ?? "").trim(),
      addressLine1: String(formData.get("addressLine1") ?? "").trim(),
      addressLine2: String(formData.get("addressLine2") ?? "").trim(),
      birthDate: String(formData.get("birthDate") ?? ""),
      termsAccepted: formData.has("termsAccepted"),
      marketingAgreed: formData.has("marketingAgreed"),
    };
  };

  const setFieldStatus = (element, type, message) => {
    if (!element) {
      return;
    }

    element.className = `field-status ${type}`;
    element.textContent = message;
  };

  phoneInput?.addEventListener("input", () => {
    phoneInput.value = formatPhoneNumber(phoneInput.value);
  });

  emailInput?.addEventListener("input", () => {
    if (emailCheckStatus) {
      emailCheckStatus.className = "field-status";
      emailCheckStatus.textContent = "";
    }
  });

  emailCheckButton?.addEventListener("click", async () => {
    const email = String(emailInput?.value ?? "").trim();
    if (!email) {
      setFieldStatus(emailCheckStatus, "error", "이메일을 입력해 주세요.");
      emailInput?.focus();
      return;
    }
    if (window.location.protocol === "file:") {
      setFieldStatus(emailCheckStatus, "error", "이메일 확인은 로컬 서버 주소에서 이용해 주세요.");
      return;
    }

    emailCheckButton.disabled = true;
    setFieldStatus(emailCheckStatus, "pending", "이메일을 확인하고 있습니다.");

    try {
      const params = new URLSearchParams({ email });
      const response = await fetch(`/api/members/email-availability?${params.toString()}`);
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFieldStatus(emailCheckStatus, "error", result.errors?.[0] ?? result.message ?? "이메일 확인에 실패했습니다.");
        return;
      }

      setFieldStatus(
        emailCheckStatus,
        result.available ? "success" : "error",
        result.available ? "사용 가능한 이메일입니다." : "이미 가입된 이메일입니다."
      );
    }
    catch (error) {
      setFieldStatus(emailCheckStatus, "error", "로컬 서버에 연결할 수 없습니다. 앱 실행 상태를 확인해 주세요.");
    }
    finally {
      emailCheckButton.disabled = false;
    }
  });

  identityVerifyButton?.addEventListener("click", () => {
    store.setStatus(signupStatus, "info", "본인인증 API 연동 준비 중입니다. 현재는 생년월일과 성인 동의로 가입을 진행합니다.");
  });

  addressSearchButton?.addEventListener("click", () => {
    const Postcode = window.kakao?.Postcode || window.daum?.Postcode;
    if (!Postcode) {
      store.setStatus(signupStatus, "error", "주소검색 서비스를 불러오지 못했습니다. 네트워크 연결 후 다시 시도해 주세요.");
      return;
    }

    new Postcode({
      oncomplete: fillAddress,
    }).open();
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (window.location.protocol === "file:") {
      store.setStatus(signupStatus, "error", "회원 정보 저장은 로컬 서버 주소에서 이용해 주세요.");
      return;
    }

    const submitButton = signupForm.querySelector("button[type='submit']");
    const payload = readSignupForm(signupForm);

    if (payload.password !== payload.passwordConfirm) {
      store.setStatus(signupStatus, "error", "비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (!payload.birthDate) {
      store.setStatus(signupStatus, "error", "본인인증 완료 후 생년월일이 자동 입력되면 회원가입을 진행할 수 있습니다.");
      return;
    }
    if (!payload.gender) {
      store.setStatus(signupStatus, "error", "성별을 선택해 주세요.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "가입 처리 중";
    store.setStatus(signupStatus, "pending", "회원 정보를 저장하고 있습니다.");

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        store.setStatus(signupStatus, "error", result.errors ?? result.message ?? "회원가입에 실패했습니다.");
        return;
      }

      store.setCurrentUser({
        memberId: result.memberId,
        email: result.email,
        name: result.name,
      });
      signupForm.reset();
      store.setStatus(signupStatus, "success", `${result.name}님의 회원가입이 완료되었습니다.`);
    }
    catch (error) {
      store.setStatus(signupStatus, "error", "로컬 서버에 연결할 수 없습니다. 앱 실행 상태를 확인해 주세요.");
    }
    finally {
      submitButton.disabled = false;
      submitButton.textContent = "회원가입";
    }
  });
})();
