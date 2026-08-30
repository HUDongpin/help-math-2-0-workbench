import { GallonConversionAnimation } from "../components/GallonConversionAnimation.jsx";

function captureFrameFrom(searchParams) {
  const value = Array.isArray(searchParams?.frame)
    ? searchParams.frame[0]
    : searchParams?.frame;
  const frame = Number(value);
  return Number.isInteger(frame) && frame > 0 ? frame : undefined;
}

export default async function Page({ searchParams }) {
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
