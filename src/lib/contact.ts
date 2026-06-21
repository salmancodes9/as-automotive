export const OWNER_PHONE_DISPLAY = "+91 60055 63521";
export const OWNER_PHONE_TEL = "+916005563521";
export const OWNER_WHATSAPP = "916005563521";

export function whatsappInquiryUrl(opts: {
  productName: string;
  productUrl?: string;
  imageUrl?: string | null;
  price?: number | null;
}) {
  const lines = [
    `Hi AS Automobiles, I'd like to inquire about: *${opts.productName}*`,
  ];
  if (opts.price != null) lines.push(`Listed price: ₹${Number(opts.price).toLocaleString("en-IN")}`);
  if (opts.imageUrl) lines.push(`Image: ${opts.imageUrl}`);
  if (opts.productUrl) lines.push(`Link: ${opts.productUrl}`);
  lines.push("Please share availability and best price.");
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${OWNER_WHATSAPP}?text=${text}`;
}