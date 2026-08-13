"use client";

import { useEffect, useState } from "react";

import { getTimeRemaining } from "@/features/products/utils/selling-state";

interface SellingCountdownProps {
  deadline: string;
}

export function SellingCountdown({ deadline }: SellingCountdownProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(deadline));

  useEffect(() => {
    function update() {
      setRemaining(getTimeRemaining(deadline));
    }

    update();

    const interval = window.setInterval(update, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [deadline]);

  return <span>{remaining}</span>;
}
