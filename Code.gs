function fetchUberReceiptsAndSavePDFs() {
  // Fetch Uber ride receipt emails from Gmail (past 100 days)
  // const threads = GmailApp.search('from:noreply@uber.com subject:"搭乘的行程" after:2025/3/15 before:2025/3/21');
  const threads = GmailApp.search('from:noreply@uber.com subject:"搭乘的行程" newer_than:100d');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UBER搭乘明細");
  
  // Read existing permalinks from column 5 (to skip already processed entries)
  let existingLinks = new Set();

  if (sheet.getLastRow() > 1) {
    existingLinks = new Set(
      sheet.getRange(2, 5, sheet.getLastRow() - 1)
         .getValues()
         .flat()
         .filter(link => !!link)
    );
  }

  
  threads.forEach(thread => {
    const msg = thread.getMessages()[0];
    const body = msg.getBody();
    const permalink = thread.getPermalink(); //信件連結
    
    // Skip if already processed
    if (existingLinks.has(permalink)) return;

    // Extract ride date (Date object + raw string format)
    let dateObj = '';
    let dateFormatted = '';

    const datePartsMatch = body.match(/(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日/);
    if (datePartsMatch) {
      const year = parseInt(datePartsMatch[1]);
      const month = parseInt(datePartsMatch[2]) - 1; // 月份從 0 開始
      const day = parseInt(datePartsMatch[3]);

      dateObj = new Date(year, month, day);  // 👉 排序用
      dateFormatted = `${year} 年 ${month + 1} 月 ${day} 日`; // 👉 原始樣式
    } else {
      dateObj = '';
      dateFormatted = '解析失敗';
    }




    // Extract fare amount
    const priceMatch = body.match(/\<span[^>]*?\>\$([\d,.]+)\<\/span\>/);
    const price = priceMatch ? priceMatch[1] : '';

    // Extract start and end addresses
   const { start, end } = extractStartEndAddress(body);


    // Extract PDF link (supports multiple formats)
    let pdfUrl = '';
    const hrefMatch = body.match(/<a[^>]+href="(https:\/\/email\.mgt\.uber\.com\/[^"]+)"[^>]*?>[^<]*?PDF<\/a>/i);

    if (hrefMatch) {
      pdfUrl = hrefMatch[1];
    } else {
      const clickMatch = body.match(/<a[^>]+href="(https:\/\/click\.uber\.com\/[^"]+)"[^>]*?>[^<]*?PDF<\/a>/i);
      if (clickMatch) {
        pdfUrl = clickMatch[1];
      } else {
        const lsClickMatch = body.match(/<a[^>]+href="(https:\/\/email\.uber\.com\/ls\/click[^"]+)"[^>]*?>[^<]*?PDF<\/a>/i);
        if (lsClickMatch) {
          pdfUrl = lsClickMatch[1];
        } else {
          const trackingMatch = body.match(/<a[^>]+href="(https:\/\/tracking\.ibt\.uber\.com\/tracking\/1\/click\/[^"]+)"[^>]*?>[^<]*?PDF<\/a>/i);
          if (trackingMatch) {
            pdfUrl = trackingMatch[1];
          }
        }
      }
    }
    Logger.log("📎 PDF 連結：" + pdfUrl);


    Logger.log(`📬 ${dateObj}, ${start} → ${end}, ${price}`);
    sheet.appendRow([dateObj, start, end, price, permalink, pdfUrl, dateFormatted]);
    // Sort by date ascending
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
     .sort({ column: 1, ascending: true });
    
  });
}

function extractStartEndAddress(body) {
  // Match addresses starting with 台灣
  const taiwanMatches = [...body.matchAll(/台灣[^<>\n\r]*/g)];
  let addressMatches = taiwanMatches;

  // Fallback to TWN-prefixed addresses if less than 2 results
  if (addressMatches.length < 2) {
    const twnMatches = [...body.matchAll(/TWN[^<>\n\r]*/g)];
    addressMatches = addressMatches.concat(twnMatches);
  }

  // Fallback to TW+City-prefixed addresses (e.g., TWTaipei)
  if (addressMatches.length < 2) {
    const twFullMatches = [...body.matchAll(/TW[A-Z][^<>\n\r]*/g)];
    addressMatches = addressMatches.concat(twFullMatches);
  }


  const start = addressMatches[0]?.[0].trim() || '';
  const end = addressMatches[1]?.[0].trim() || '';

  Logger.log("📍 Pickup: " + start);
  Logger.log("📍 Drop-off: " + end);

  return { start, end };
}




