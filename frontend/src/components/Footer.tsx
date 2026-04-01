import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#F4F4F4] bg-[#030303] text-[#F4F4F4] relative z-10">
      <div className="flex flex-col md:flex-row items-center justify-between p-6 text-xs font-mono uppercase text-[#888]">
        <div className="flex gap-6 mb-4 md:mb-0">
          <span>V 0.1.0-BETA</span>
          <span>SOLANA FIRST</span>
        </div>
        
        <div className="flex gap-6">
          <Link href="/docs" className="hover:text-white transition-none">[ DOCS ]</Link>
        </div>

        <div className="mt-4 md:mt-0">
          READ-ONLY BETA // OPEN SOURCE
        </div>
      </div>
    </footer>
  );
}
