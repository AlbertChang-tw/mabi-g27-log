# 瑪奇 G27 副本掉落紀錄

團隊共用的 G27 副本材料管理系統。手機/電腦打開網頁填掉落，自動寫入 Google Sheet，隊友即時看到庫存與缺口。

## 🎯 功能

- **快速登記**：選成員 → 填有掉的材料數量 → 送出，10 秒搞定
- **自動彙總**：Google Sheet 即時統計掉落總量、隊伍需求、缺口
- **武器需求自動計算**：團員用下拉選武器，系統自動算出需要的 G27 材料（29 把武器對照表）
- **共產機制**：標記成員是否共產，只有共產的掉落計入公庫

## 📁 檔案說明

| 檔案 | 用途 |
|---|---|
| `index.html` | 前端表單（部署到 GitHub Pages） |
| `submit.mp3` | 送出音效 |
| `apps-script.gs` | Google Apps Script 後端 |
| `G27_materials_template.xlsx` | Google Sheet 範本（6 張表、公式與下拉皆已設定） |
| `weapons.json` | 29 把武器的 G27 材料配方（來源：eldisa/mabinogi-tools） |

## 🚀 部署步驟

### 1. 建立 Google Sheet

1. 去 [sheets.new](https://sheets.new) 開新試算表
2. `檔案 → 匯入 → 上傳` `G27_materials_template.xlsx` → **取代試算表**

### 2. 部署 Apps Script

1. 試算表選單 `擴充功能 → Apps Script`
2. 把 `apps-script.gs` 內容貼進去、存檔
3. 右上 `部署 → 新增部署 → 類型：網頁應用程式`
4. 執行身分選「我」、存取權限選「任何人」
5. 複製「網頁應用程式網址」

### 3. 連結前端

把 `index.html` 裡的 `ENDPOINT_URL` 改成剛剛複製的 URL：

```javascript
const ENDPOINT_URL = "https://script.google.com/macros/s/你的ID/exec";
```

### 4. GitHub Pages

Repo Settings → Pages → Source: `main` branch → Save。等 1-2 分鐘拿到網址。

## 🎨 設計

深色主題、Linear/Notion 風格，手機優先。

## 🙏 致謝

武器配方資料來自 [eldisa/mabinogi-tools](https://github.com/eldisa/mabinogi-tools)。
