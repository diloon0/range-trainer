/**
 * Range Trainer sync for YOUR Google Sheet.
 * Paste this whole file into Extensions > Apps Script of the Sheet, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * The app sends changes in batches; this script keeps two tabs:
 *   Ranges  : one row per situation (newest edit wins)
 *   Answers : one row per answered hand (added once, never changed)
 */
const RANGE_HEAD = ["Situation", "Grid (169 squares, R/C/F/-)", "Source", "Updated", "Since (JSON)", "Deleted"];
const ANS_HEAD = ["Id", "Time", "Situation", "Hand", "Your answer", "Correct answer", "Right?", "Deal mode", "Folded early"];

function tab_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); sh.getRange(1, 1, 1, head.length).setFontWeight("bold");
    // plain text so grids like "-RRC..." and ids are never read as numbers or formulas
    if (name === "Ranges") sh.getRange("B:B").setNumberFormat("@"); else sh.getRange("A:F").setNumberFormat("@"); }
  return sh;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() {
  return json_({ok: true, app: "range-trainer", note: "Sync link works. Paste this link into the app's Sync tab."});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return json_({ok: false, error: "Sheet busy, try again"}); }
  try {
    const req = JSON.parse(e.postData.contents || "{}");
    const rs = tab_("Ranges", RANGE_HEAD), as = tab_("Answers", ANS_HEAD);

    // ----- ranges: upsert, newest "u" wins -----
    const rv = rs.getDataRange().getValues(); const rowOf = {};
    for (let i = 1; i < rv.length; i++) if (rv[i][0]) rowOf[rv[i][0]] = i;
    const incoming = req.ranges || {}; const appends = [];
    Object.keys(incoming).forEach(k => {
      const r = incoming[k], u = Number(r.u || 0);
      const row = [k, r.deleted ? "" : (r.g || ""), r.src || "", u, r.since ? JSON.stringify(r.since) : "", r.deleted ? "yes" : ""];
      if (k in rowOf) { if (u >= Number(rv[rowOf[k]][3] || 0)) rv[rowOf[k]] = row; }
      else { rowOf[k] = rv.length + appends.length; appends.push(row); }
    });
    if (rv.length > 1) rs.getRange(2, 1, rv.length - 1, RANGE_HEAD.length).setValues(rv.slice(1).map(r => r.slice(0, RANGE_HEAD.length)));
    if (appends.length) rs.getRange(rv.length + 1, 1, appends.length, RANGE_HEAD.length).setValues(appends);

    // ----- answers: append ones the Sheet doesn't have yet -----
    const lastA = as.getLastRow();
    const ids = new Set(lastA > 1 ? as.getRange(2, 1, lastA - 1, 1).getValues().map(r => String(r[0])) : []);
    const newRows = (req.answers || []).filter(a => a.id && !ids.has(String(a.id))).map(a =>
      [String(a.id), Number(a.t), a.k, a.h, a.a, a.c, a.ok ? "yes" : "no", a.mode || "", a.early ? "yes" : ""]);
    if (newRows.length) {
      as.getRange(lastA + 1, 1, newRows.length, ANS_HEAD.length).setValues(newRows);
    }

    // ----- send back everything ranges + answers after the device's last row -----
    const out = {}; const all = rs.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      const [k, g, src, u, since, del] = all[i]; if (!k) continue;
      out[k] = del ? {deleted: true, u: Number(u)} : {g: String(g), src: src || "custom", u: Number(u)};
      if (!del && since) { try { out[k].since = JSON.parse(since); } catch (err) {} }
    }
    const total = as.getLastRow() - 1, from = Math.max(0, Number(req.answerRow || 0));
    let answers = [];
    if (total > from) answers = as.getRange(2 + from, 1, total - from, ANS_HEAD.length).getValues().map(r => ({
      id: String(r[0]), t: Number(r[1]), k: r[2], h: r[3], a: r[4], c: r[5], ok: r[6] === "yes", mode: r[7] || "", early: r[8] === "yes"}));
    return json_({ok: true, ranges: out, answers: answers, answerRows: total});
  } catch (err) {
    return json_({ok: false, error: String(err)});
  } finally { lock.releaseLock(); }
}
