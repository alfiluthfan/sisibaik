export const EXPIRING_SOON_MINUTES = 120;

export type ProductSellingState =
  | "draft"
  | "active"
  | "expiring_soon"
  | "sold_out"
  | "expired"
  | "archived";

interface ProductSellingStateInput {
  status: "draft" | "active" | "sold_out" | "expired" | "archived";

  available_stock: number;

  pickup_deadline: string;
}

export function getProductSellingState(
  product: ProductSellingStateInput,

  now = new Date(),
): ProductSellingState {
  /*
   * Archived dan draft mempunyai
   * prioritas tertinggi.
   */

  if (product.status === "archived") {
    return "archived";
  }

  if (product.status === "draft") {
    return "draft";
  }

  const deadline = new Date(product.pickup_deadline);

  /*
   * Penting:
   *
   * Kita tetap cek deadline di aplikasi
   * walaupun Cron berjalan setiap 5 menit.
   *
   * Jadi UI tidak perlu menunggu Cron.
   */

  if (deadline.getTime() <= now.getTime()) {
    return "expired";
  }

  if (product.available_stock <= 0) {
    return "sold_out";
  }

  if (product.status === "expired") {
    return "expired";
  }

  const warningTime = new Date(
    now.getTime() + EXPIRING_SOON_MINUTES * 60 * 1000,
  );

  if (deadline.getTime() <= warningTime.getTime()) {
    return "expiring_soon";
  }

  return "active";
}

export function getTimeRemaining(
  deadline: string,

  now = new Date(),
) {
  const difference = new Date(deadline).getTime() - now.getTime();

  if (difference <= 0) {
    return "Sudah berakhir";
  }

  const totalMinutes = Math.floor(difference / 60_000);

  const days = Math.floor(totalMinutes / (60 * 24));

  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} hari ${hours} jam`;
  }

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }

  return `${minutes} menit`;
}
