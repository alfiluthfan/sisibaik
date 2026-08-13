import type { ProductSellingState } from "@/features/products/utils/selling-state";

interface Props {
  state: ProductSellingState;
}

export function SellingStatusBadge({ state }: Props) {
  const configuration = {
    active: {
      label: "Aktif",

      className: "bg-green-50 text-green-700",
    },

    expiring_soon: {
      label: "Segera Berakhir",

      className: "bg-orange-50 text-orange-700",
    },

    sold_out: {
      label: "Stok Habis",

      className: "bg-gray-100 text-gray-600",
    },

    expired: {
      label: "Expired",

      className: "bg-red-50 text-red-700",
    },

    draft: {
      label: "Draft",

      className: "bg-blue-50 text-blue-700",
    },

    archived: {
      label: "Diarsipkan",

      className: "bg-gray-100 text-gray-500",
    },
  };

  const config = configuration[state];

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}
