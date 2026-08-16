(() => {
  const store = window.SVStore;
  const productDetail = document.querySelector("[data-product-detail]");
  const quantityInput = document.querySelector("[data-product-quantity]");
  const quantityButtons = Array.from(document.querySelectorAll("[data-quantity-step]"));
  const productTotal = document.querySelector("[data-product-total]");
  const purchaseStatus = document.querySelector("[data-purchase-status]");
  const addCartButton = document.querySelector("[data-cart-add]");
  const buyNowButton = document.querySelector("[data-buy-now]");
  const productOption = document.querySelector("[data-product-option]");

  if (!store || !productDetail) {
    return;
  }

  const productId = productDetail.dataset.productId || "sv-nos-black";
  const product = store.getProductById(productId);
  const productPrice = product?.price ?? Number(productDetail.dataset.productPrice ?? "0");

  const getQuantity = () => {
    const value = Number(quantityInput?.value ?? "1");

    if (!Number.isFinite(value)) {
      return 1;
    }

    return Math.min(10, Math.max(1, Math.floor(value)));
  };

  const updateTotal = () => {
    if (!productTotal || !quantityInput) {
      return;
    }

    const quantity = getQuantity();
    quantityInput.value = String(quantity);
    productTotal.textContent = store.formatPrice(productPrice * quantity);
  };

  const addCurrentProductToCart = () => {
    const quantity = getQuantity();
    const option = productOption?.value ?? product?.options?.[0] ?? "기본 옵션";
    const item = store.addToCart(productId, { quantity, option });

    if (!item) {
      store.setStatus(purchaseStatus, "error", "상품 정보를 불러올 수 없습니다.");
      return null;
    }

    store.setStatus(purchaseStatus, "success", `${item.name} ${quantity}개가 장바구니에 담겼습니다.`);
    return item;
  };

  quantityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!quantityInput) {
        return;
      }

      quantityInput.value = String(getQuantity() + Number(button.dataset.quantityStep));
      updateTotal();
    });
  });

  quantityInput?.addEventListener("input", updateTotal);

  addCartButton?.addEventListener("click", () => {
    addCurrentProductToCart();
  });

  buyNowButton?.addEventListener("click", () => {
    const item = addCurrentProductToCart();
    if (item) {
      window.location.href = "checkout.html";
    }
  });

  updateTotal();
})();
