interface Props {
  status: "reserved" | "picked_up" | "cancelled" | "expired";
}

export function OrderStatusBadge({ status }: Props) {
  const config = {
    reserved: {
      label: "Menunggu Diambil",

      style: "bg-blue-50 text-blue-700",
    },

    picked_up: {
      label: "Sudah Diambil",

      style: "bg-green-50 text-green-700",
    },

    cancelled: {
      label: "Dibatalkan",

      style: "bg-red-50 text-red-700",
    },

    expired: {
      label: "Kedaluwarsa",

      style: "bg-gray-100 text-gray-600",
    },
  };

  const item = config[status];

  return (
    <span
      className={`
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        ${item.style}
      `}
    >
      {item.label}
    </span>
  );
}
