/**
 * G27 副本掉落紀錄 · Apps Script 後端
 * 接收前端 POST → 蓋伺服器時間戳 → 寫入「掉落紀錄」sheet
 *
 * 部署步驟：
 * 1. Google Sheet → 擴充功能 → Apps Script
 * 2. 把這整份程式碼貼進去、存檔
 * 3. 右上「部署」→「新增部署」→ 類型「網頁應用程式」
 * 4. 執行身份「我」、存取權限「任何人」
 * 5. 授權，拿到 URL
 * 6. 把 URL 貼到 index.html 的 ENDPOINT_URL
 */

const TIMEZONE = "Asia/Taipei";
const SHEET_LOG = "掉落紀錄";
const SHEET_MEMBERS = "成員主檔";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.member || !Array.isArray(data.drops) || data.drops.length === 0) {
      return jsonResponse({ ok: false, error: "invalid payload" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const log = ss.getSheetByName(SHEET_LOG);
    const members = ss.getSheetByName(SHEET_MEMBERS);
    if (!log) return jsonResponse({ ok: false, error: "sheet 掉落紀錄 not found" });

    const shareMap = buildShareMap(members);
    const timestamp = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
    const shareFlag = shareMap[data.member] || "";

    const rows = data.drops
      .filter(d => d && d.material && Number(d.qty) > 0)
      .map(d => [timestamp, data.member, shareFlag, d.material, Number(d.qty)]);

    if (rows.length > 0) {
      log.getRange(log.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
    }

    return jsonResponse({ ok: true, written: rows.length });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function buildShareMap(sheet) {
  const map = {};
  if (!sheet) return map;
  const last = sheet.getLastRow();
  if (last < 2) return map;
  const values = sheet.getRange(2, 1, last - 1, 2).getValues();
  values.forEach(([name, share]) => {
    if (name) map[String(name).trim()] = share;
  });
  return map;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 測試用：手動在 Apps Script 編輯器執行，模擬一筆送出
 */
function testWrite() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        member: "破鳥",
        drops: [
          { material: "布里萊赫核心", qty: 2 },
          { material: "綠意盎然的木柴", qty: 5 }
        ]
      })
    }
  };
  const res = doPost(fakeEvent);
  Logger.log(res.getContent());
}
