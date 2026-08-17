(() => {
  const store = window.SVStore;
  const checkoutShell = document.querySelector("[data-checkout-shell]");
  const checkoutForm = document.querySelector("[data-checkout-form]");
  const checkoutSummary = document.querySelector("[data-checkout-summary]");
  const checkoutStatus = document.querySelector("[data-checkout-status]");
  const completePanel = document.querySelector("[data-order-complete]");

  if (!store || !checkoutShell || !checkoutForm || !checkoutSummary) {
    return;
  }

  const cart = store.readCart();
  const user = store.getCurrentUser();

  const renderEmpty = () => {
    checkoutShell.innerHTML = `
      <div class="empty-state">
        <h2>결제할 상품이 없습니다.</h2>
        <span>상품을 장바구니에 담은 뒤 결제를 진행할 수 있습니다.</span>
        <a class="product-detail-link" href="home.html#featured">상품 보러가기</a>
      </div>
    `;
  };

  const renderSummary = () => {
    const totals = store.getCartTotals(cart);
    const itemMarkup = cart.map((item) => `
      <div class="checkout-item">
        <strong>
          <span>${item.name}</span>
          <span>${store.formatPrice(item.price * item.quantity)}</span>
        </strong>
        <span>${item.option} · ${item.quantity}개</span>
      </div>
    `).join("");

    checkoutSummary.innerHTML = `
      <div class="checkout-items">${itemMarkup}</div>
      <div class="summary-line">
        <span>상품 금액</span>
        <strong>${store.formatPrice(totals.subtotal)}</strong>
      </div>
      <div class="summary-line">
        <span>배송비</span>
        <strong>${totals.shipping === 0 ? "무료" : store.formatPrice(totals.shipping)}</strong>
      </div>
      <div class="summary-line total">
        <span>최종 결제 금액</span>
        <strong>${store.formatPrice(totals.total)}</strong>
      </div>
    `;
  };

  const prefillUser = () => {
    if (!user) {
      store.setStatus(checkoutStatus, "info", "비회원 주문으로 진행합니다. 주문 완료 후 주문번호와 수취인 전화번호로 조회할 수 있습니다.");
      return;
    }

    const nameInput = checkoutForm.querySelector("[name='recipient']");
    const emailInput = checkoutForm.querySelector("[name='email']");
    if (nameInput && !nameInput.value) {
      nameInput.value = user.name;
    }
    if (emailInput && !emailInput.value) {
      emailInput.value = user.email;
    }
  };

  const submitOrderToServer = async (payload) => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: user ? user.memberId ?? user.id ?? null : null,
        recipient: payload.recipient,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        memo: payload.memo,
        paymentMethod: payload.paymentMethod,
        adultConfirmed: payload.adultConfirmed,
        items: cart.map((item) => ({
          name: item.name,
          option: item.option,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = Array.isArray(data.errors) && data.errors.length
        ? data.errors.join(" ")
        : (data.message || "주문 접수 중 오류가 발생했습니다. 다시 시도해 주세요.");
      throw new Error(message);
    }
    return data;
  };

  const recordLocalOrder = (payload, serverOrder) => {
    const totals = store.getCartTotals(cart);
    const order = {
      id: serverOrder.orderNo,
      createdAt: new Date().toISOString(),
      status: "주문 접수",
      orderType: user ? "MEMBER" : "GUEST",
      customer: user ?? null,
      shipping: payload,
      items: cart,
      totals,
    };
    const orders = store.readOrders();
    orders.unshift(order);
    store.writeOrders(orders);
    store.clearCart();
    return order;
  };

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(checkoutForm);
    const payload = {
      recipient: String(formData.get("recipient") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      memo: String(formData.get("memo") ?? "").trim(),
      paymentMethod: String(formData.get("paymentMethod") ?? "card"),
      adultConfirmed: formData.has("adultConfirmed"),
    };

    if (!payload.recipient || !payload.email || !payload.phone || !payload.address) {
      store.setStatus(checkoutStatus, "error", "배송 정보의 필수 항목을 입력해 주세요.");
      return;
    }

    if (!payload.adultConfirmed) {
      store.setStatus(checkoutStatus, "error", "성인 구매 확인에 동의해 주세요.");
      return;
    }

    const submitButton = checkoutForm.querySelector(".submit-button");
    if (submitButton) {
      submitButton.disabled = true;
    }
    store.setStatus(checkoutStatus, "info", "주문을 접수하는 중입니다...");

    let serverOrder;
    try {
      serverOrder = await submitOrderToServer(payload);
    }
    catch (error) {
      store.setStatus(checkoutStatus, "error", error.message || "주문 접수 중 오류가 발생했습니다. 다시 시도해 주세요.");
      if (submitButton) {
        submitButton.disabled = false;
      }
      return;
    }

    const order = recordLocalOrder(payload, serverOrder);
    checkoutShell.hidden = true;
    completePanel.classList.add("is-visible");
    completePanel.querySelector("[data-order-id]").textContent = order.id;
    completePanel.querySelector("[data-order-total]").textContent = store.formatPrice(order.totals.total);

    const historyLink = completePanel.querySelector("[data-order-history-link]");
    if (!user && historyLink) {
      historyLink.textContent = "비회원 주문조회";
      historyLink.setAttribute("href", "#");
      historyLink.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        store.openGuestOrderDrawer({ orderId: order.id, phone: order.shipping.phone });
      });
    }
  });

  if (!cart.length) {
    renderEmpty();
    return;
  }

  renderSummary();
  prefillUser();
})();
