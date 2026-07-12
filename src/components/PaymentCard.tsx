"use client";

import { CheckSquareIcon, SquareIcon } from "lucide-react";
import { motion } from "framer-motion";
import { CardNetworkLogo, getCardNetwork } from "@/components/CardLogos";

export interface PaymentCardProps {
  id: string;
  title: string;
  number: string;
  name?: string;
  expiry?: string;
  subtype?: "credit" | "debit";
  colorClass: string;
  selected: boolean;
  selectionMode: boolean;
  checked: boolean;
  index: number;
  onActivate: () => void;
  onToggleChecked: (event: React.SyntheticEvent) => void;
  onCopyNumber: (value: string) => void;
}

export function PaymentCard({
  id,
  title,
  number,
  name,
  expiry,
  subtype,
  colorClass,
  selected,
  selectionMode,
  checked,
  index,
  onActivate,
  onToggleChecked,
  onCopyNumber,
}: PaymentCardProps) {
  const network = getCardNetwork(number);
  const formattedNumber = number.replace(/(\d{4})/g, "$1 ").trim();

  return (
    <motion.article
      id={`item-${id}`}
      layout
      data-selected={selected || undefined}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 28,
        delay: Math.min(index * 0.035, 0.16),
      }}
      className="wallet-card-wrap"
    >
      <button
        type="button"
        className={`wallet-card aspect-[1.586/1] bg-gradient-to-br ${colorClass}`}
        onClick={selectionMode ? onToggleChecked : onActivate}
        aria-current={selected ? "true" : undefined}
        aria-pressed={selectionMode ? checked : undefined}
        aria-label={`${title}, ${subtype ?? "payment"} card`}
      >
        <span className="wallet-card-highlight" aria-hidden="true" />
        {selectionMode && (
          <span className="wallet-card-check">
            {checked ? <CheckSquareIcon /> : <SquareIcon />}
          </span>
        )}
        <span className="wallet-card-top">
          <span>
            <small>{subtype ?? "payment"} card</small>
            <strong>{title}</strong>
          </span>
          <CardNetworkLogo network={network} />
        </span>
        <span className="wallet-card-number">{formattedNumber}</span>
        <span className="wallet-card-bottom">
          <span>
            <small>Cardholder</small>
            <strong>{name || "Card holder"}</strong>
          </span>
          <span>
            <small>Expires</small>
            <strong>{expiry || "••/••"}</strong>
          </span>
        </span>
      </button>
      <button
        type="button"
        className="wallet-card-copy"
        onClick={(event) => {
          event.stopPropagation();
          onCopyNumber(number);
        }}
        aria-label={`Copy card number for ${title}`}
      >
        Copy card number
      </button>
    </motion.article>
  );
}
