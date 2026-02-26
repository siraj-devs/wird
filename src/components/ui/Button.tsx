import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "success";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "rounded-md px-4 py-2 focus:outline-none disabled:opacity-50 transition-colors";

  const variantStyles = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500",
    secondary:
      "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400",
    ghost: "bg-transparent text-primary-700  hover:underline",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
