/** WhatsApp number for payment screenshot submission (Pakistan local format). */
export const PAYMENT_WHATSAPP = "03214284689";

/** E.164 without + for wa.me links (92 + number without leading 0). */
export function paymentWhatsAppLink() {
  return `https://wa.me/92${PAYMENT_WHATSAPP.slice(1)}`;
}
