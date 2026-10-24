# IN009 clean source inputs and native JSON generation

The input closure is scripts/inputs/typography-v1/g4-l3-in009/input-manifest.json (SHA4a8d92eac916fbde59ac8421250f6cfca9417f8214a5f32907e7a831b8f00a3e). It contains91members plusmanifest: all41 exactsource-auditoutputs andhistoricalmanifest, frozenexistingmachineextraction/catalog, reviewedgeometry/packing/census/clip/nativeIR references, exact11PNG+rawtagbindings, reviewedreplayalgorithms andthemaintainedstructuralSWFreader. OriginalSWF isNOTbundled. NoSQL/privatearchives/unrelatedsourcebinaries areincluded.

From repositoryroot:

```
python3 packages/demos/src/modern-lessons/g4-l3-in009/verify-inputs.py
node packages/demos/src/modern-lessons/g4-l3-in009/source-verify.mjs --source-swf '/absolute/path/to/L3IN09.swf'
python3 packages/demos/src/modern-lessons/g4-l3-in009/generate-source.py --source-swf '/absolute/path/to/L3IN09.swf'
python3 packages/demos/src/modern-lessons/g4-l3-in009/generate-source.py --check --source-swf '/absolute/path/to/L3IN09.swf'
```

Omit --source-swf onlywhen the exact1967129-byte originalexists atmanifest.sourceSwfRepositoryPath. Hash mustbe766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c. Wrong/missingoriginalfailsclosed. Runtimebundle neverrequiresoriginalSWForworkfolder. Tools requireNodebuiltins andPythonstandardlibrary; noFFDec/OCR/browser/npmdependency orcredential.

source-verify reparses the suppliedoriginalthrough the frozenmaintainedstructuralreader anddeep-compares allcatalogdata (onlycatalogpublication assetId/source metadata removed); verifiesall11rawbitmaptags againstoriginalSWFbytes andPNGhash/dimensions. Theold independentdecoded-pixel receiptsarepreservedinputs; thisdoesnotclaimnewJPEG/pixeldecode.

generate-source verifiesexactinputmembership/hash first, then usesa disposabletemporarycompatibilitytree. It places ONLYthispage's frozeninputs at their historicalrelativepaths, copies the suppliedexactSWF temporarily, and reruns extract/morph/disposition/word algorithms. It checksall41sourceoutputs unchanged; contact sheets/logs/historicalaudittexts arepreservedfrozenbytes ratherthanclaimedfreshlyrendered. Geometrycompiler, losslesspacking, clipV2 andnativeIR replaymustmatch074c/255a/f94/f120. Weatherdata is regeneratedfromexactreviewedcensus710a; reviewedtranscription isinput, neverfictionallyre-OCRed. ExistingfrozenmachineXML isused; no newFFDec extraction.

Fourmaintainedoutputs are source.generated.json,weather.generated.json,clip.generated.json,thermometer-geometry.generated.json. Wholeword/tick/caption/frame semantics, all141weatherlabels, all637clipframes andthermometergeometry exactlymatchreviewedworkreferences. SourceRefs nowpointtocleaninputpaths. Globalhistoricalpending/acceptance/prototype-status fields areexcludedfromcurrentruntimeJSON; selectedmodernterminalpolicy isdescribedwithoutsourceauthoredstopclaim. Historicaloriginalmetadata remainsimmutableunderinputs/source andinputs/reviewed. Do nothandeditgeneratedoutputs.

Rootpublicassetgeneratorinputs:

- reviewed/geometry.packed.json exact255a39f3657d8a73b265881c3bce47bd4bd076ded10fec29238986f25a056ea0; reviewed/geometry.generated.json.gz exact074c49335c133cdbab6c25d08b1a8cfa2f799dd58875ede1b5ccf0af73c63f32.
- source/all-timeline-frames.json.gz,source/timelines.json,source/texts.json,source/buttons.json,source/roles/reveal-morph-geometry.json andsource-catalog.json.gz holdsource-readerdefinitions. Publicruntimecompaction/equivalence verification isroot-owned; thisgeneratorpreservessourceinputvalues.
- bitmap-specs.json recordsid/cleanpath/sha256/bytes/width/height/sourceTag/rawTagSha256; bitmaps/bitmap-ID.png contains11exactPNGbytes. RootassignsfinalpublicURLs, neverusehistoricalfixtureURLs.
- reviewed/census.json exact710a8ae281a18dddf9b7700e9ac49e7755a5014d25d9e98515a3fa624b86d16a; reviewed/projection.json.gz exactf94fcc1609cb606d3af48a9063cabd3cbdf6d0b6c32358775ae391d718d8c40e.

A freshcopiedstagedtree with no originalworkpackages successfullyreplayed--check whenexplicitoriginalSWFwasprovided. Extra member, changedbitmap, missingframeinput andwrongSWF eachrejected. Thisprovescleaninputreproducibility, notsourceFlashfidelity,humanlistening orOwneracceptance. PCM67proposal andterminalcontract areseparateandunchanged.
