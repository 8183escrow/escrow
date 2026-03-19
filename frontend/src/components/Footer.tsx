import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#F4F4F4] bg-[#030303] text-[#F4F4F4] relative z-10">
      <div className="flex flex-col md:flex-row items-center justify-between p-6 text-xs font-mono uppercase text-[#888]">
        <div className="flex gap-6 mb-4 md:mb-0">
          <span>V 2.1.0-RC</span>
          <span>ERC-8183 COMPLIANT</span>
        </div>
        
        <div className="flex gap-6">
          <Link href="/docs" className="hover:text-white transition-none">[ DOCS ]</Link>
          <a href="https://x.com/8183escrow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-none">
            [ X ]
          </a>
          <a href="https://github.com/8183escrow/escrow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-none">
            [ GITHUB ]
          </a>
        </div>

        <div className="mt-4 md:mt-0">
          ALL RIGHTS RESERVED // OPEN SOURCE
        </div>
      </div>
    </footer>
  );
}
