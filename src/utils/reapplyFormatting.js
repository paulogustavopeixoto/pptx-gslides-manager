
/**
 * reapplyFormattingByID
 *
 * Reapplies run-level & paragraph-level styling from your updated paragraphs/runs.
 * 
 * - We do *not* re-derive paragraphs from joined text. Instead, we rely on
 *   `originalParagraphs` directly. This avoids the typical “paragraph mismatch” issue.
 * - If you want to replicate exact “i./ii./iii.” bullets, you’d typically need
 *   to re-use the original listId / nesting level from the shape’s `lists` object.
 *   For simplicity, we do a “best-effort” approach using bullet presets.
 */
function reapplyFormattingByID(
  requests,
  shapeId,
  updatedRuns,
  originalRuns,
  originalParagraphs,
  isTable = false,
  cellLocation = null
) {
  console.log(`Reapplying formatting for shape ${shapeId} using IDs...`);
  console.log(`UpdatedRuns for shape [${shapeId}]:`, JSON.stringify(updatedRuns, null, 2));

  //
  // (A) Reapply run-level styles
  //
  for (const updatedRun of updatedRuns) {
    const runLength = updatedRun.text?.length || 0;
    if (runLength === 0) continue;

    // If you have a separate "originalRuns" that includes the styles:
    const match = originalRuns.find((r) => r.id === updatedRun.id);
    if (!match) continue; // no style match found

    const s = match.style || {};
    const styleUpdate = {};
    const fields = [];

    if (typeof s.bold === "boolean") {
      styleUpdate.bold = s.bold;
      fields.push("bold");
    }
    if (typeof s.italic === "boolean") {
      styleUpdate.italic = s.italic;
      fields.push("italic");
    }
    if (typeof s.underline === "boolean") {
      styleUpdate.underline = s.underline;
      fields.push("underline");
    }
    if (typeof s.strikethrough === "boolean") {
      styleUpdate.strikethrough = s.strikethrough;
      fields.push("strikethrough");
    }
    if (s.fontFamily) {
      styleUpdate.fontFamily = s.fontFamily;
      fields.push("fontFamily");
    }
    if (s.fontSize) {
      styleUpdate.fontSize = s.fontSize;
      fields.push("fontSize");
    }
    if (s.foregroundColor?.opaqueColor) {
      styleUpdate.foregroundColor = s.foregroundColor;
      fields.push("foregroundColor");
    }
    if (s.backgroundColor?.opaqueColor) {
      styleUpdate.backgroundColor = s.backgroundColor;
      fields.push("backgroundColor");
    }
    if (s.weightedFontFamily) {
      styleUpdate.weightedFontFamily = s.weightedFontFamily;
      fields.push("weightedFontFamily");
    }
    if (s.baselineOffset) {
      styleUpdate.baselineOffset = s.baselineOffset;
      fields.push("baselineOffset");
    }
    if (typeof s.smallCaps === "boolean") {
      styleUpdate.smallCaps = s.smallCaps;
      fields.push("smallCaps");
    }

    if (fields.length > 0) {
      requests.push({
        updateTextStyle: {
          objectId: shapeId,
          style: styleUpdate,
          fields: fields.join(","),
          textRange: {
            type: "FIXED_RANGE",
            startIndex: updatedRun.startIndex,
            endIndex: updatedRun.endIndex,
          },
          ...(isTable && cellLocation ? { cellLocation } : {}),
        },
      });
    }
  }

  //
  // (B) Reapply paragraph-level styles & bullets
  //
  for (const paragraph of originalParagraphs) {
    if (!paragraph.runs?.length) continue;

    const pStartIndex = paragraph.startIndex ?? 0;
    const pEndIndex = paragraph.endIndex ?? pStartIndex;
    if (pEndIndex <= pStartIndex) {
      // empty paragraph
      continue;
    }

    // Check if paragraph has any visible text
    const hasVisibleText = paragraph.runs.some(r => (r.text || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().length > 0);

    // 1) Bullets: create or delete
    // If bullet != null & we have text, create bullets. Else, delete them
    if (paragraph.bullet && paragraph.bullet.bulletStyle && hasVisibleText) {

      // Get the bullet color from the `bulletStyle`
      const bulletColor = paragraph.bullet.bulletStyle.foregroundColor;

      // Optionally map your "glyph" to a preset:
      const bulletGlyph = paragraph.bullet.glyph;  // e.g. "i.", "ii.", "iii."
      let bulletPreset = "BULLET_DISC_CIRCLE_SQUARE"; // default fallback

      // A simple mapping example:
      if (bulletGlyph === "i." || bulletGlyph === "ii." || bulletGlyph === "iii.") {
        // Use alpha Roman, but it won't be exact: "I, II, III" typically
        bulletPreset = "NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT";
      }
      // For actual “i.” you’d need the original list structure, or you can
      // store the paragraph’s “listId” and replicate it. The API does not
      // have a direct “exactly i.” bullet preset.

      console.log(`-> Creating bullet for paragraph ${paragraph.id}, bullet=`, paragraph.bullet);
      requests.push({
        createParagraphBullets: {
          objectId: shapeId,
          textRange: {
            type: "FIXED_RANGE",
            startIndex: pStartIndex,
            endIndex: pEndIndex,
          },
          foregroundColor: bulletColor,
          bold: paragraph.bullet.bulletStyle.bold,
          italic: paragraph.bullet.bulletStyle.italic,
          fontFamily: paragraph.bullet.bulletStyle.fontFamily,
          fontSize: paragraph.bullet.bulletStyle.fontSize,
          strikethrough: paragraph.bullet.bulletStyle.strikethrough,
          weightedFontFamily: paragraph.bullet.bulletStyle.weightedFontFamily,
          bulletPreset,
          ...(isTable && cellLocation ? { cellLocation } : {}),
        },
      });
    } else {
      // If bullet is null or no visible text, remove bullets
      requests.push({
        deleteParagraphBullets: {
          objectId: shapeId,
          textRange: {
            type: "FIXED_RANGE",
            startIndex: pStartIndex,
            endIndex: pEndIndex,
          },
          ...(isTable && cellLocation ? { cellLocation } : {}),
        },
      });
    }

    // 2) Reapply paragraph style
    const ps = paragraph.paragraphStyle || {};
    const styleObj = {};
    const styleFields = [];

    if (ps.alignment) {
      styleObj.alignment = ps.alignment;
      styleFields.push("alignment");
    }
    if (typeof ps.lineSpacing !== "undefined") {
      styleObj.lineSpacing = ps.lineSpacing;
      styleFields.push("lineSpacing");
    }
    if (ps.indentStart?.unit) {
      styleObj.indentStart = ps.indentStart;
      styleFields.push("indentStart");
    }
    if (ps.indentEnd?.unit) {
      styleObj.indentEnd = ps.indentEnd;
      styleFields.push("indentEnd");
    }
    if (ps.indentFirstLine?.unit) {
      styleObj.indentFirstLine = ps.indentFirstLine;
      styleFields.push("indentFirstLine");
    }
    if (ps.spaceAbove && (ps.spaceAbove.unit || ps.spaceAbove.magnitude)) {
      styleObj.spaceAbove = ps.spaceAbove;
      styleFields.push("spaceAbove");
    }
    if (ps.spaceBelow && (ps.spaceBelow.unit || ps.spaceBelow.magnitude)) {
      styleObj.spaceBelow = ps.spaceBelow;
      styleFields.push("spaceBelow");
    }
    if (ps.direction) {
      styleObj.direction = ps.direction;
      styleFields.push("direction");
    }
    if (ps.spacingMode) {
      styleObj.spacingMode = ps.spacingMode;
      styleFields.push("spacingMode");
    }

    if (styleFields.length > 0) {
      requests.push({
        updateParagraphStyle: {
          objectId: shapeId,
          textRange: {
            type: "FIXED_RANGE",
            startIndex: pStartIndex,
            endIndex: pEndIndex,
          },
          style: styleObj,
          fields: styleFields.join(","),
          ...(isTable && cellLocation ? { cellLocation } : {}),
        },
      });
    }
  }

  console.log(`Requests for shape ${shapeId}:`, JSON.stringify(requests, null, 2));
}

module.exports = reapplyFormattingByID;