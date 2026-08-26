(function () {
  var OUTPUT_ROOT = "file:///Users/peter/Desktop/HELP%20MATH_Flash_To_JS/work/animate";

  try {

  function safeName(value) {
    return String(value || "untitled").replace(/[^A-Za-z0-9._-]+/g, "-");
  }

  function optionalString(value) {
    return value == null ? null : String(value);
  }

  function safeProperty(value, key) {
    try {
      return value == null || typeof value[key] === "undefined" ? null : value[key];
    } catch (error) {
      return null;
    }
  }

  function optionalNumber(value) {
    return typeof value === "number" && isFinite(value) ? value : null;
  }

  function matrixSummary(matrix) {
    if (!matrix) {
      return null;
    }
    return {
      a: optionalNumber(safeProperty(matrix, "a")),
      b: optionalNumber(safeProperty(matrix, "b")),
      c: optionalNumber(safeProperty(matrix, "c")),
      d: optionalNumber(safeProperty(matrix, "d")),
      tx: optionalNumber(safeProperty(matrix, "tx")),
      ty: optionalNumber(safeProperty(matrix, "ty")),
      x: optionalNumber(safeProperty(matrix, "x")),
      y: optionalNumber(safeProperty(matrix, "y"))
    };
  }

  function colorTransformSummary(element) {
    return {
      colorMode: optionalString(safeProperty(element, "colorMode")),
      alphaAmount: optionalNumber(safeProperty(element, "colorAlphaAmount")),
      alphaPercent: optionalNumber(safeProperty(element, "colorAlphaPercent")),
      redAmount: optionalNumber(safeProperty(element, "colorRedAmount")),
      redPercent: optionalNumber(safeProperty(element, "colorRedPercent")),
      greenAmount: optionalNumber(safeProperty(element, "colorGreenAmount")),
      greenPercent: optionalNumber(safeProperty(element, "colorGreenPercent")),
      blueAmount: optionalNumber(safeProperty(element, "colorBlueAmount")),
      bluePercent: optionalNumber(safeProperty(element, "colorBluePercent")),
      tintColor: optionalString(safeProperty(element, "tintColor")),
      tintPercent: optionalNumber(safeProperty(element, "tintPercent")),
      brightness: optionalNumber(safeProperty(element, "brightness"))
    };
  }

  function filterSummary(filter) {
    return {
      name: optionalString(safeProperty(filter, "name")),
      enabled: safeProperty(filter, "enabled"),
      quality: optionalString(safeProperty(filter, "quality")),
      blurX: optionalNumber(safeProperty(filter, "blurX")),
      blurY: optionalNumber(safeProperty(filter, "blurY")),
      angle: optionalNumber(safeProperty(filter, "angle")),
      distance: optionalNumber(safeProperty(filter, "distance")),
      strength: optionalNumber(safeProperty(filter, "strength")),
      color: optionalString(safeProperty(filter, "color")),
      shadowColor: optionalString(safeProperty(filter, "shadowColor")),
      highlightColor: optionalString(safeProperty(filter, "highlightColor")),
      knockout: safeProperty(filter, "knockout"),
      inner: safeProperty(filter, "inner"),
      hideObject: safeProperty(filter, "hideObject")
    };
  }

  function filtersSummary(element) {
    var filters = safeProperty(element, "filters");
    var result = [];
    if (!filters || typeof filters.length !== "number") {
      return result;
    }
    for (var index = 0; index < filters.length; index += 1) {
      result.push(filterSummary(filters[index]));
    }
    return result;
  }

  function textSummary(element) {
    var text = null;
    try {
      text = typeof element.getTextString === "function" ? element.getTextString() : safeProperty(element, "text");
    } catch (error) {
      text = safeProperty(element, "text");
    }

    var attributes = {};
    var attributeNames = [
      "face", "size", "fillColor", "bold", "italic", "alignment", "letterSpacing",
      "autoKern", "lineSpacing", "leftMargin", "rightMargin", "indent"
    ];
    if (typeof element.getTextAttr === "function") {
      for (var index = 0; index < attributeNames.length; index += 1) {
        var attributeName = attributeNames[index];
        try {
          attributes[attributeName] = safeProperty(element, "length") > 0
            ? element.getTextAttr(attributeName, 0, safeProperty(element, "length") - 1)
            : element.getTextAttr(attributeName);
        } catch (error) {
          attributes[attributeName] = null;
        }
      }
    }

    return {
      textType: optionalString(safeProperty(element, "textType")),
      text: optionalString(text),
      length: optionalNumber(safeProperty(element, "length")),
      selectable: safeProperty(element, "selectable"),
      border: safeProperty(element, "border"),
      lineType: optionalString(safeProperty(element, "lineType")),
      orientation: optionalString(safeProperty(element, "orientation")),
      attributes: attributes
    };
  }

  function elementSummary(element, index) {
    var elementType = optionalString(safeProperty(element, "elementType"));
    var libraryItem = safeProperty(element, "libraryItem");
    var result = {
      index: index,
      elementType: elementType,
      instanceType: optionalString(safeProperty(element, "instanceType")),
      symbolType: optionalString(safeProperty(element, "symbolType")),
      name: optionalString(safeProperty(element, "name")),
      depth: optionalNumber(safeProperty(element, "depth")),
      libraryItemName: optionalString(safeProperty(libraryItem, "name")),
      libraryItemType: optionalString(safeProperty(libraryItem, "itemType")),
      x: optionalNumber(safeProperty(element, "x")),
      y: optionalNumber(safeProperty(element, "y")),
      width: optionalNumber(safeProperty(element, "width")),
      height: optionalNumber(safeProperty(element, "height")),
      rotation: optionalNumber(safeProperty(element, "rotation")),
      scaleX: optionalNumber(safeProperty(element, "scaleX")),
      scaleY: optionalNumber(safeProperty(element, "scaleY")),
      skewX: optionalNumber(safeProperty(element, "skewX")),
      skewY: optionalNumber(safeProperty(element, "skewY")),
      matrix: matrixSummary(safeProperty(element, "matrix")),
      transformationPoint: matrixSummary(safeProperty(element, "transformationPoint")),
      blendMode: optionalString(safeProperty(element, "blendMode")),
      cacheAsBitmap: safeProperty(element, "cacheAsBitmap"),
      visible: safeProperty(element, "visible"),
      colorTransform: colorTransformSummary(element),
      filters: filtersSummary(element)
    };

    if (elementType === "text") {
      result.text = textSummary(element);
    }
    return result;
  }

  function frameSummary(frame, index) {
    var summary = {
      index: index,
      flashFrame: index + 1,
      startFrame: frame.startFrame,
      duration: frame.duration,
      name: optionalString(frame.name),
      labelType: optionalString(frame.labelType),
      soundName: optionalString(frame.soundName),
      soundSync: optionalString(frame.soundSync),
      soundLoop: optionalNumber(safeProperty(frame, "soundLoop")),
      soundLoopMode: optionalString(safeProperty(frame, "soundLoopMode")),
      soundEffect: optionalString(safeProperty(frame, "soundEffect")),
      tweenType: optionalString(safeProperty(frame, "tweenType")),
      tweenEasing: optionalNumber(safeProperty(frame, "tweenEasing")),
      motionTweenRotate: optionalString(safeProperty(frame, "motionTweenRotate")),
      motionTweenRotateTimes: optionalNumber(safeProperty(frame, "motionTweenRotateTimes")),
      elementCount: frame.elements ? frame.elements.length : 0,
      actionScriptLength: frame.actionScript ? frame.actionScript.length : 0,
      elements: []
    };

    var elements = frame.elements || [];
    for (var elementIndex = 0; elementIndex < elements.length; elementIndex += 1) {
      summary.elements.push(elementSummary(elements[elementIndex], elementIndex));
    }

    return summary;
  }

  function timelineSummary(timeline) {
    var result = {
      name: optionalString(timeline.name),
      frameCount: timeline.frameCount,
      layerCount: timeline.layers.length,
      currentFrame: timeline.currentFrame,
      currentFlashFrame: timeline.currentFrame + 1,
      layers: []
    };

    for (var layerIndex = 0; layerIndex < timeline.layers.length; layerIndex += 1) {
      var layer = timeline.layers[layerIndex];
      var layerResult = {
        index: layerIndex,
        name: optionalString(layer.name),
        layerType: optionalString(layer.layerType),
        parentLayerName: optionalString(safeProperty(safeProperty(layer, "parentLayer"), "name")),
        visible: layer.visible,
        locked: layer.locked,
        outline: safeProperty(layer, "outline"),
        color: optionalString(safeProperty(layer, "color")),
        height: optionalNumber(safeProperty(layer, "height")),
        frameCount: layer.frames.length,
        keyframes: []
      };

      for (var frameIndex = 0; frameIndex < layer.frames.length; frameIndex += 1) {
        var frame = layer.frames[frameIndex];
        if (frame && frame.startFrame === frameIndex) {
          layerResult.keyframes.push(frameSummary(frame, frameIndex));
        }
      }

      result.layers.push(layerResult);
    }

    return result;
  }

  function librarySummary(library) {
    var result = [];
    var items = library && library.items ? library.items : [];

    for (var index = 0; index < items.length; index += 1) {
      var item = items[index];
      var itemResult = {
        index: index,
        name: optionalString(item.name),
        itemType: optionalString(item.itemType),
        linkageClassName: optionalString(item.linkageClassName),
        linkageIdentifier: optionalString(item.linkageIdentifier),
        linkageExportForAS: item.linkageExportForAS === true,
        linkageImportForRS: item.linkageImportForRS === true
      };

      if (item.timeline) {
        itemResult.timeline = timelineSummary(item.timeline);
      }

      itemResult.asset = {
        sourceFilePath: optionalString(safeProperty(item, "sourceFilePath")),
        compressionType: optionalString(safeProperty(item, "compressionType")),
        originalCompressionType: optionalString(safeProperty(item, "originalCompressionType")),
        quality: optionalNumber(safeProperty(item, "quality")),
        useImportedJPEGQuality: safeProperty(item, "useImportedJPEGQuality"),
        sampleRate: optionalString(safeProperty(item, "sampleRate")),
        bitRate: optionalString(safeProperty(item, "bitRate")),
        bits: optionalString(safeProperty(item, "bits")),
        stereo: safeProperty(item, "stereo"),
        fileLastModifiedDate: optionalString(safeProperty(item, "fileLastModifiedDate"))
      };

      result.push(itemResult);
    }

    return result;
  }

  function quoteJSON(value) {
    var result = '"';
    var text = String(value);

    for (var index = 0; index < text.length; index += 1) {
      var character = text.charAt(index);
      var code = text.charCodeAt(index);

      if (character === '"' || character === "\\") {
        result += "\\" + character;
      } else if (character === "\b") {
        result += "\\b";
      } else if (character === "\f") {
        result += "\\f";
      } else if (character === "\n") {
        result += "\\n";
      } else if (character === "\r") {
        result += "\\r";
      } else if (character === "\t") {
        result += "\\t";
      } else if (code < 32) {
        result += "\\u" + ("000" + code.toString(16)).slice(-4);
      } else {
        result += character;
      }
    }

    return result + '"';
  }

  function stringifyJSON(value, inArray) {
    if (value === null) {
      return "null";
    }

    var valueType = typeof value;
    if (valueType === "string") {
      return quoteJSON(value);
    }
    if (valueType === "number") {
      return isFinite(value) ? String(value) : "null";
    }
    if (valueType === "boolean") {
      return value ? "true" : "false";
    }
    if (valueType === "undefined" || valueType === "function") {
      return inArray ? "null" : null;
    }

    var parts = [];
    var index;
    if (Object.prototype.toString.call(value) === "[object Array]") {
      for (index = 0; index < value.length; index += 1) {
        parts.push(stringifyJSON(value[index], true));
      }
      return "[" + parts.join(",") + "]";
    }

    for (var key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        var encoded = stringifyJSON(value[key], false);
        if (encoded !== null) {
          parts.push(quoteJSON(key) + ":" + encoded);
        }
      }
    }
    return "{" + parts.join(",") + "}";
  }

  function writeResult(uri, value) {
    if (!FLfile.write(uri, stringifyJSON(value, false))) {
      throw new Error("Unable to write " + uri);
    }
  }

  var document = fl.getDocumentDOM();
  if (!document) {
    throw new Error("No Animate document is open");
  }

  FLfile.createFolder(OUTPUT_ROOT);
  FLfile.remove(OUTPUT_ROOT + "/animate-audit-error.txt");

  var documentName = safeName(document.name);
  var documentTimeline = document.getTimeline();
  var report = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    authority: "Adobe Animate authoring document opened without saving",
    limitations: [
      "Animate 2021 warns that ActionScript 1.0 is unsupported and converts the in-memory document to ActionScript 3.0.",
      "Attached ActionScript 1.0 code may be removed in memory; original SWF bytecode remains authoritative for those scripts.",
      "Legacy FLA files must be opened in a fresh Animate process one at a time because Animate 2021 can reuse the first legacy document state within a session.",
      "A current-frame PNG is authoring-stage evidence, not proof of runtime branches or audio synchronization.",
      "Element, matrix, text, filter, color-transform, mask-layer, tween, and sound-placement fields are recursively inventoried at authoring keyframes, but converted or unsupported legacy properties may still be null."
    ],
    animateVersion: optionalString(fl.version),
    capturedAt: new Date().toUTCString(),
    document: {
      name: optionalString(document.name),
      pathURI: optionalString(document.pathURI),
      width: document.width,
      height: document.height,
      frameRate: document.frameRate,
      backgroundColor: optionalString(document.backgroundColor),
      asVersion: optionalString(document.asVersion),
      playerVersion: optionalString(document.playerVersion),
      libraryItemCount: document.library && document.library.items ? document.library.items.length : 0
    },
    timeline: timelineSummary(documentTimeline),
    library: librarySummary(document.library),
    recursiveLibraryTimelineAudit: true
  };

  var reportURI = OUTPUT_ROOT + "/" + documentName + "-authoring-audit.json";
  var pngURI = OUTPUT_ROOT + "/" + documentName + "-frame-" + (documentTimeline.currentFrame + 1) + ".png";

  writeResult(reportURI, report);
  document.exportPNG(pngURI, true, true);
  fl.trace("HELP Math authoring audit written: " + reportURI);
  fl.trace("HELP Math current-frame PNG written: " + pngURI);
  } catch (error) {
    FLfile.createFolder(OUTPUT_ROOT);
    FLfile.write(
      OUTPUT_ROOT + "/animate-audit-error.txt",
      String(error && error.message ? error.message : error) + "\n"
    );
    fl.trace("HELP Math authoring audit failed: " + error);
  }
})();
