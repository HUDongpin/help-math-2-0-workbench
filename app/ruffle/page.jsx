import Link from "next/link";

import { RuffleFlashPlayer } from "../../components/RuffleFlashPlayer.jsx";

export const metadata = {
  title: "Conversion_1_4 · Ruffle",
};

export default function RufflePage() {
  return (
    <main className="ruffle-page-shell">
      <header className="ruffle-page-header">
        <div>
          <p className="kicker">Original SWF · Ruffle 0.4.1</p>
          <h1>Conversion_1_4</h1>
        </div>
        <Link className="text-link" href="/">
          JavaScript rebuild
        </Link>
      </header>

      <RuffleFlashPlayer
        swfUrl="/flash/Conversion_1_4.swf"
        title="Original liter-to-milliliters Flash animation"
      />
    </main>
  );
}
