add_action('wp_footer', function() {
?>
<script>
async function customCheckout() {
  try {
    const res = await fetch('/wp-json/wc/store/cart');

    if (!res.ok) {
      throw new Error('Unable to load the WooCommerce cart.');
    }

    const cart = await res.json();

    if (!cart.items || cart.items.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const minorUnit = Number(cart.totals?.currency_minor_unit ?? 2);
    const currencyDivisor = Math.pow(10, minorUnit);

    const items = cart.items.map(item => {
      // WooCommerce Store API returns selected product variations here.
      const variationEntries = Array.isArray(item.variation) ? item.variation : [];
      const itemDataEntries = Array.isArray(item.item_data) ? item.item_data : [];
      const optionEntries = [...variationEntries, ...itemDataEntries]
        .map(entry => ({
          label: String(entry.attribute || entry.name || entry.key || 'Option').trim(),
          value: String(entry.value || entry.display || entry.display_value || '').trim()
        }))
        .filter(entry => entry.value);

      const attributes = optionEntries.reduce((result, entry) => {
        result[entry.label] = entry.value;
        return result;
      }, {});

      // If a theme/plugin puts the strength only in the product name, retain it
      // as a final fallback so values such as 10 mg or 3 mL still reach checkout.
      const strengthInName = String(item.name || '').match(/\b\d+(?:\.\d+)?\s*(?:mg|ml)\b/i)?.[0] || '';
      const selectedOptionLabel = optionEntries.map(entry => entry.value).join(' / ') || strengthInName;
      const unitPrice = Number(item.prices?.price ?? 0) / currencyDivisor;

      return {
        productId: item.id,
        variationId: item.variation_id || 0,
        name: item.name,
        price: unitPrice,
        quantity: item.quantity,
        total: unitPrice * item.quantity,
        image: item.images?.[0]?.src || item.images?.[0]?.thumbnail || '',
        selectedOptionLabel,
        attributes
      };
    });

    const hasFreeShipping = items.some(item =>
      item.name.toLowerCase().includes('gxz glp-1')
    );

    const shipping = hasFreeShipping ? 0 : 10;
    const subtotal = Number(cart.totals?.total_price ?? 0) / currencyDivisor;
    const orderData = {
      items,
      totalItems: cart.items_count,
      subtotal,
      shippingCost: shipping,
      totalPrice: subtotal + shipping
    };

    const encoded = encodeURIComponent(JSON.stringify(orderData));
    console.log('Redirecting with:', orderData);

    window.location.href =
      'https://health.gxzhealth.com/checkout?order=' + encoded;
  } catch (error) {
    console.error(error);
    alert('Checkout error. Please refresh the page and try again.');
  }
}

document.addEventListener('click', function(e) {
  const btn = e.target.closest('.xoo-wsc-ft-btn-checkout');

  if (btn) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    customCheckout();
  }
}, true);
</script>
<?php
});
