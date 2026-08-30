import { GallonConversionAnimation } from "../../components/GallonConversionAnimation.jsx";

export const metadata = {
  title: "Conversion_1_2 · JavaScript rebuild",
};

function captureFrameFrom(searchParams) {
  const value = Array.isArray(searchParams?.frame)
    ? searchParams.frame[0]
    : searchParams?.frame;
  const frame = Number(value);
  return Number.isInteger(frame) && frame > 0 ? frame : undefined;
}

export default async function ConversionOneTwoPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  return (
    <main className="page-shell faithful-page-shell">
      <section aria-label="Faithful JavaScript rebuild of Conversion_1_2">
        <GallonConversionAnimation
          spanishFormulaFlag="off"
          captureFrame={captureFrameFrom(resolvedSearchParams)}
        />
      </section>
    </main>
  );
}
