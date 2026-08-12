interface MerchantStatusBadgeProps {
  status: "pending" | "approved" | "rejected";
}

export function MerchantStatusBadge({ status }: MerchantStatusBadgeProps) {
  const styles = {
    pending: "bg-yellow-50 text-yellow-700",

    approved: "bg-green-50 text-green-700",

    rejected: "bg-red-50 text-red-700",
  };

  const labels = {
    pending: "Menunggu",

    approved: "Disetujui",

    rejected: "Ditolak",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        ${styles[status]}
      `}
    >
      {labels[status]}
    </span>
  );
}
