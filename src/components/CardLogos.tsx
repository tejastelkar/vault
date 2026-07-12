import React from "react";
import Image from "next/image";

export type CardNetwork = "visa" | "mastercard" | "amex" | "rupay" | "discover" | "maestro" | "generic";

export function getCardNetwork(value: string): CardNetwork {
  const normalized = value.trim().toLowerCase();
  if (/visa|^4/.test(normalized)) return "visa";
  if (/mastercard|master card/.test(normalized)) return "mastercard";
  if (/amex|american express/.test(normalized)) return "amex";
  if (/rupay/.test(normalized)) return "rupay";
  if (/discover/.test(normalized)) return "discover";
  if (/maestro/.test(normalized)) return "maestro";

  const digits = normalized.replace(/\D/g, "");
  const firstTwo = Number(digits.slice(0, 2));
  const firstFour = Number(digits.slice(0, 4));
  const firstSix = Number(digits.slice(0, 6));
  if (digits.startsWith("4")) return "visa";
  if ((firstFour >= 2221 && firstFour <= 2720) || (firstTwo >= 51 && firstTwo <= 55)) return "mastercard";
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";
  if (digits.startsWith("60") || digits.startsWith("652") || digits.startsWith("6069") || digits.startsWith("6070")) return "rupay";
  if (digits.startsWith("6011") || digits.startsWith("65") || (firstSix >= 622126 && firstSix <= 622925)) return "discover";
  if (digits.startsWith("50") || (firstTwo >= 56 && firstTwo <= 69)) return "maestro";
  return "generic";
}

export function CardNetworkLogo({ network, className = "" }: { network: CardNetwork; className?: string }) {
  if (network === "visa" || network === "rupay") {
    const isVisa = network === "visa";
    return (
      <img 
        src={isVisa ? "/visa.svg" : "/rupay.svg"} 
        alt={isVisa ? "Visa" : "RuPay"} 
        className={`h-7 w-auto object-contain object-right drop-shadow-sm ${className}`} 
      />
    );
  }

  if (network === "mastercard" || network === "maestro") {
    const maestro = network === "maestro";
    return (
      <svg viewBox="0 0 46 30" className={`h-8 w-auto drop-shadow-sm ${className}`} role="img" aria-label={maestro ? "Maestro" : "Mastercard"}>
        <circle cx="16" cy="15" r="14" fill="#EB001B" />
        <circle cx="30" cy="15" r="14" fill={maestro ? "#0099DF" : "#F79E1B"} />
        <path d="M23 3.2a14 14 0 0 1 0 23.6 14 14 0 0 1 0-23.6Z" fill={maestro ? "#7673C0" : "#FF5F00"} />
      </svg>
    );
  }

  const label = network === "amex" ? "AMEX" : network === "discover" ? "DISCOVER" : "CARD";
  return <span className={`text-[11px] font-extrabold tracking-[0.08em] text-white ${className}`} aria-label={label}>{label}</span>;
}
