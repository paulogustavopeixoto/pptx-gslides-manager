
/**
 * preserveParagraphBoundaries
 *
 * Given an original set of paragraphs (origParas) and a set of updatedParas
 * (each having .runs), enforce that updatedParas has the same length as origParas.
 * 
 * If updatedParas has fewer paragraphs, add extras. If it has more, merge them
 * into the last paragraph. Optionally ensure trailing \n matches the original.
 */
function preserveParagraphBoundaries(origParas, updatedParas) {
  const originalCount = origParas.length;

  // If updated has more paragraphs, merge extras into the last one
  while (updatedParas.length > originalCount) {
    const last = updatedParas.pop();
    if (last && updatedParas.length > 0) {
      updatedParas[updatedParas.length - 1].runs.push(...last.runs);
    }
  }

  // If updated has fewer paragraphs, create empty placeholders
  while (updatedParas.length < originalCount) {
    updatedParas.push({
      id: `paragraph-extra-${updatedParas.length}`,
      runs: [],
      paragraphStyle: {},
      bullet: null,
      startIndex: 0,
      endIndex: 0,
    });
  }

  // (A) Preserve per-paragraph newlines according to the original
  for (let i = 0; i < originalCount; i++) {
    const origP = origParas[i];
    const updP = updatedParas[i];
    if (!updP.runs?.length) continue;

    const origLastRun = origP.runs[origP.runs.length - 1] || null;
    const updLastRun = updP.runs[updP.runs.length - 1] || null;

    if (!origLastRun || !updLastRun) continue;

    // If original ended in \n, ensure updated ends in \n
    if (origLastRun.text.endsWith("\n") && !updLastRun.text.endsWith("\n")) {
      updLastRun.text += "\n";
    }
    // If original did NOT end in \n, remove any trailing \n from updated
    else if (!origLastRun.text.endsWith("\n")) {
      updLastRun.text = updLastRun.text.replace(/\n+$/, "");
    }
  }

  // (B) Finally, remove the trailing newline from the *very last* run
  //     in the shape if it exists
  const lastParagraph = updatedParas[updatedParas.length - 1];
  if (lastParagraph && lastParagraph.runs?.length > 0) {
    const lastRun = lastParagraph.runs[lastParagraph.runs.length - 1];
    // (B) Condition: If the entire run is only newlines, keep a single \n?
    if (lastRun.text.match(/^\n+$/)) {
      // Optionally keep exactly one newline, or remove them all, up to you
      lastRun.text = "\n"; // keep one
    }
    else {
      // If the run has actual text plus a newline, maybe remove the trailing ones
      lastRun.text = lastRun.text.replace(/\n+$/, "");
    }
  }
}

module.exports = preserveParagraphBoundaries;