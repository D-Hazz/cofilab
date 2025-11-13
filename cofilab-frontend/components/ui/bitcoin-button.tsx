import { Button } from "@/components/ui/button";

export function BitcoinButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      className="bg-bitcoin hover:bg-bitcoin-dark text-slate-900 font-semibold shadow-sm"
    >
      {children}
    </Button>
  );
}
