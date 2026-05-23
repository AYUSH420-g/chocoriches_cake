const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";

function razorpayKeyId() {
  return import.meta.env.VITE_RAZORPAY_KEY_ID || "";
}

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function openRazorpayCheckout({ amount, customer, order, onSuccess, onDismiss }) {
  const loaded = await loadRazorpay();
  const key = order?.keyId || razorpayKeyId();

  if (!loaded || !key || !window.Razorpay) {
    return false;
  }

  const checkout = new window.Razorpay({
    key,
    amount,
    currency: "INR",
    name: "ChocoRiches",
    description: "Fresh cake order",
    order_id: order?.id,
    prefill: {
      name: customer?.name || "",
      email: customer?.email || "",
      contact: customer?.phone || "",
    },
    theme: {
      color: "#e61951",
    },
    handler(response) {
      onSuccess?.(response);
    },
    modal: {
      ondismiss() {
        onDismiss?.();
      },
    },
  });

  checkout.open();
  return true;
}

export {
  openRazorpayCheckout,
  razorpayKeyId
};
