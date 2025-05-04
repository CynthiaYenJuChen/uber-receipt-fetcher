# 🚗 Uber 搭乘紀錄擷取工具（Google Apps Script）

本工具可 **每日自動從 Gmail 擷取 Uber 行程信件內容**，解析搭乘資訊（起訖地點、金額、日期等），依照日期排序並寫入指定 Google Sheet。支援多種格式的 PDF 電子明細連結擷取。

---

## 📌 功能概覽

| 項目         | 說明                                                    |
|--------------|---------------------------------------------------------|
| 📬 資料來源   | Gmail 中主旨為「搭乘的行程」的 Uber 信件                |
| 📅 擷取欄位   | 搭乘日期、起點、終點、金額、信件連結、PDF 連結      |
| 📊 輸出位置   | Google Sheet（名稱：`UBER搭乘明細`）                    |

---

## ✅ 已實作功能

- 自動搜尋近 `100 天` Uber 搭乘信件（可自訂條件 `newer_than` 或 `before/after`）
- 自動跳過已處理過的信件（根據 permalink）
- 自動解析信件內容中的：
  - 🚩 日期（格式化為 `Date` 物件）
  - 📍 起點 / 終點地址（處理異常格式與地區碼）
  - 💰 金額（純數字）
  - 📎 電子明細 PDF 連結
  - 🔗 信件 permalink（便於追蹤）
- 📑 將資料寫入 Google Sheet 並依日期升冪排序
- 📆 可每日自動觸發（透過 Apps Script 時間觸發器）

---

## 🧠 技術挑戰與解析

### 1. PDF 連結格式多樣且非附件形式

Uber 的電子明細連結非傳統附件，而是 HTML 內的 `<a>` 超連結，且格式隨機為：

- `https://email.mgt.uber.com/...`
- `https://click.uber.com/...`
- `https://email.uber.com/ls/click?...`
- `https://tracking.ibt.uber.com/tracking/1/click/...`

📌 本工具已內建 **多層 fallback 邏輯**，自動抓取最合適的連結。

---

### 2. 地址格式混用且變動大

起訖地點可能出現：

- `台灣` 開頭地區，如「台灣桃園市...」
- `TWN` 為前綴代碼，如「TWN台北市...」
- `TW+城市名` 開頭，如「TWTaipei新北市...」

📌 本工具優先採用「台灣」開頭格式，如不足兩筆，則依序補上 `TWN` 與 `TWX`，並過濾非地址干擾字元。


---

## 📁 輸出資料結構（Google Sheet）

| 欄位名稱       | 說明                                       |
|----------------|--------------------------------------------|
| 日期           | `Date` 物件（可排序）                      |
| 起點           | 起始地點（自動偵測台灣/TWN地址）           |
| 終點           | 終點地點                                   |
| 金額           | 金額數字（不含符號）                      |
| 信件連結       | 該封 Gmail 信件 permalink                 |
| PDF 連結       | Uber 提供的 PDF 明細頁連結                 |
| 原始日期格式   | 原始文字樣式        |

---

## 🧩 相依技術

- Google Apps Script (Gmail API, Spreadsheet API)
- 正規表達式解析 HTML 信件內容

---

📄 Google Sheet 工作表名稱為 `UBER搭乘明細`（請勿更改），欄位名稱建議如下：

| A     | B    | C  | D      | E           | F         | G               |
|-------|------|----|--------|-------------|-----------|------------------|
| 日期  | 起點 | 終點 | 金額    | 信件連結 | PDF 連結 | 原始日期格式 |

📌 實際畫面參考：

![Google Sheet 欄位示意圖](./docs/sheet-example.png)

---

## 👩‍💻 開發與維護

本工具由 [CynthiaYenJuChen](https://github.com/CynthiaYenJuChen) 開發與持續維護，歡迎自行 Fork 修改，或提出 PR / Issue 協作改善 🙌

