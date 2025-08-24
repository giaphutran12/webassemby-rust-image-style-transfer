import React from "react";

export function Footer(): JSX.Element {
  console.log("Footer rendered");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 py-6 text-sm text-gray-300 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <p className="m-0">© {year} Image Style Transfer</p>
        <p className="m-0 opacity-75">Built with Rust, WebAssembly & Next.js</p>
      </div>
    </footer>
  );
}
