(() => {
  const store = window.SVStore;
  const cartList = document.querySelector("[data-cart-list]");
  const cartSummary = document.querySelector("[data-cart-summary]");
  const checkoutButton = document.querySelector("[data-checkout-button]");
  const clearButton = document.querySelector("[data-clear-cart]");

  if (!store || !cartList || !cartSummary) {
    return;
  }

  const itemMediaMarkup = (item) => {
    if (item.image) {
      return `<img src="${item.image}" alt="${item.name} 제품 이미지">`;
    }

    if (item.designKind) {
      return `<span class="product-shape product-shape--${String(item.designKind).toLowerCase()}" aria-hidden="true"><i></i><b></b><em></em></span>`;
    }

    return `<span class="product-visual ${item.visual}" aria-hidden="true"></span>`;
  };

  const renderSummary = (cart) => {
    const totals = store.getCartTotals(cart);
    cartSummary.innerHTML = `
      <div class="summary-line">
        <span>상품 수</span>
        <strong>${totals.count}개</strong>
      </div>
      <div class="summary-line">
        <span>상품 금액</span>
        <strong>${store.formatPrice(totals.subtotal)}</strong>
      </div>
      <div class="summary-line">
        <span>배송비</span>
        <strong>${totals.shipping === 0 ? "무료" : store.formatPrice(totals.shipping)}</strong>
      </div>
      <div class="summary-line total">
        <span>결제 예정 금액</span>
        <strong>${store.formatPrice(totals.total)}</strong>
      </div>
    `;

    if (checkoutButton) {
      checkoutButton.disabled = totals.count === 0;
    }
  };

  const renderCart = () => {
    const cart = store.readCart();

    if (!cart.length) {
      cartList.innerHTML = `
        <div class="empty-state">
          <h2>장바구니가 비어 있습니다.</h2>
          <span>필요한 상품을 담으면 이곳에서 수량과 결제 금액을 확인할 수 있습니다.</span>
          <a class="product-detail-link" href="home.html#featured">상품 보러가기</a>
        </div>
      `;
      renderSummary(cart);
      return;
    }

    cartList.innerHTML = cart.map((item) => {
      const itemKey = store.getItemKey(item);
      return `
        <article class="cart-item" data-cart-item="${itemKey}">
          <div class="cart-item-media ${item.colorClass ?? "tile-cobalt"}">
            ${itemMediaMarkup(item)}
          </div>
          <div>
            <p>${item.category} · ${item.option}</p>
            <h3>${item.name}</h3>
            <strong>${store.formatPrice(item.price)}</strong>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-control" aria-label="${item.name} 수량">
              <button type="button" aria-label="수량 감소" data-cart-step="-1">-</button>
              <input type="number" min="1" max="10" value="${item.quantity}" inputmode="numeric" data-cart-quantity>
              <button type="button" aria-label="수량 증가" data-cart-step="1">+</button>
            </div>
            <button class="remove-button" type="button" data-cart-remove>삭제</button>
          </div>
        </article>
      `;
    }).join("");

    cartList.querySelectorAll("[data-cart-item]").forEach((cartItem) => {
      const itemKey = cartItem.dataset.cartItem;
      const quantityInput = cartItem.querySelector("[data-cart-quantity]");

      cartItem.querySelectorAll("[data-cart-step]").forEach((button) => {
        button.addEventListener("click", () => {
          const nextQuantity = Number(quantityInput.value) + Number(button.dataset.cartStep);
          store.setCartItemQuantity(itemKey, nextQuantity);
          renderCart();
        });
      });

      quantityInput.addEventListener("input", () => {
        store.setCartItemQuantity(itemKey, quantityInput.value);
        renderCart();
      });

      cartItem.querySelector("[data-cart-remove]").addEventListener("click", () => {
        store.removeCartItem(itemKey);
        renderCart();
      });
    });

    renderSummary(cart);
  };

  checkoutButton?.addEventListener("click", () => {
    window.location.href = "checkout.html";
  });

  clearButton?.addEventListener("click", () => {
    store.clearCart();
    renderCart();
  });

  renderCart();
})();
