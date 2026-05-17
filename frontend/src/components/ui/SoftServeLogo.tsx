import Image from "next/image";
 
interface SoftServeLogoProps {
  size?: number;
  className?: string;
}
 
export function SoftServeLogo({ size = 32, className = "" }: SoftServeLogoProps) {
  return (
    <Image
      src="/softserve-logo.jpeg"
      alt="SoftServe"
      width={size}
      height={size}
      className={`rounded-md object-cover ${className}`}
    />
  );
}