import Link from "next/link";

import { RuffleFlashPlayer } from "../../../components/RuffleFlashPlayer.jsx";

export const metadata = {
  title: "Conversion_1_2 · Ruffle reference",
};

export default function ConversionOneTwoRufflePage() {
  return (
    <main className="ruffle-page-shell">
      <header className="ruffle-page-header">
        <div>
          <p className="kicker">Original SWF · Ruffle reference</p>
          <h1>Conversion_1_2</h1>
        </div>
        <Link className="text-link" href="/">
          JavaScript rebuild
        </Link>
      </header>

      <RuffleFlashPlayer
        swfUrl="/flash/Conversion_1_2.swf"
        title="Original Conversion 1.2 Flash animation"
      />
    </main>
  );
}
