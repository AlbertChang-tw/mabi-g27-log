/**
 * G27 副本掉落紀錄 · Apps Script 後端
 *
 * 包含兩組功能：
 * 1. doPost - 接收前端表單送出，寫入「掉落紀錄」
 * 2. completeCrafting - 扣除武器材料（配合「庫存總覽」按鈕）
 */

const TIMEZONE = "Asia/Taipei";
const SHEET_LOG = "掉落紀錄";
const SHEET_MEMBERS = "成員主檔";
const SHEET_DASH = "庫存總覽";
const SHEET_NEEDS = "製作需求";
const SHEET_RECIPES = "武器配方";
const SHEET_CONSUMED = "消耗紀錄";
const DASH_MEMBER_CELL = "H1";  // 庫存總覽上放「目前製作對象」的格

// ========================================================================
// 前端表單送出 → 寫入掉落紀錄
// ========================================================================

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

// ========================================================================
// 完成製作 → 扣除材料（綁在「庫存總覽」按鈕）
// ========================================================================

function completeCrafting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const dash = ss.getSheetByName(SHEET_DASH);
  const needs = ss.getSheetByName(SHEET_NEEDS);
  const recipes = ss.getSheetByName(SHEET_RECIPES);
  const consumed = ss.getSheetByName(SHEET_CONSUMED);

  if (!dash || !needs || !recipes || !consumed) {
    ui.alert("找不到必要分頁。需要：庫存總覽、製作需求、武器配方、消耗紀錄");
    return;
  }

  const member = dash.getRange(DASH_MEMBER_CELL).getValue();
  if (!member) {
    ui.alert("請先在「目前製作對象」選一個成員");
    return;
  }

  // 在製作需求第 1 列找出該成員的欄位
  const headers = needs.getRange(1, 1, 1, needs.getLastColumn()).getValues()[0];
  const memberCol = headers.indexOf(member) + 1;
  if (memberCol < 1) {
    ui.alert("『製作需求』找不到成員: " + member);
    return;
  }

  // 第 2 列是武器名稱
  const weapon = needs.getRange(2, memberCol).getValue();
  if (!weapon || weapon === "不製作") {
    ui.alert(member + " 目前是「不製作」或未選武器");
    return;
  }

  // 確認對話框
  const confirm = ui.alert(
    "完成製作",
    "要扣除 " + member + " 的 " + weapon + " 所需材料嗎？",
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  // 在武器配方找那一列
  const recipeHeaders = recipes.getRange(1, 1, 1, recipes.getLastColumn()).getValues()[0];
  const lastRecipeRow = recipes.getLastRow();
  const weaponNames = recipes.getRange(2, 1, lastRecipeRow - 1, 1).getValues().map(r => r[0]);
  const weaponRowIdx = weaponNames.indexOf(weapon) + 2;
  if (weaponRowIdx < 2) {
    ui.alert("『武器配方』找不到武器: " + weapon);
    return;
  }
  const row = recipes.getRange(weaponRowIdx, 1, 1, recipes.getLastColumn()).getValues()[0];

  // 寫入消耗紀錄
  const date = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const rows = [];
  for (let i = 1; i < row.length; i++) {
    const qty = Number(row[i]);
    if (qty > 0) {
      rows.push([date, member, weapon, recipeHeaders[i], qty]);
    }
  }

  if (rows.length === 0) {
    ui.alert("這把武器沒有任何 G27 材料需求（配方可能空白）");
    return;
  }

  consumed.getRange(consumed.getLastRow() + 1, 1, rows.length, 5).setValues(rows);

  // 把該成員的武器改為「不製作」，避免重複計算
  needs.getRange(2, memberCol).setValue("不製作");

  ui.alert("✅ 已扣除 " + rows.length + " 種材料\n" +
           member + " 的武器已自動改為「不製作」");
}

// ========================================================================
// 測試用
// ========================================================================

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
