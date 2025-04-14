function fetchUberReceiptsAndSavePDFs() {
  const threads = GmailApp.search('from:noreply@uber.com subject:"Uber 電子明細" newer_than:30d');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UBER搭乘明細");
  const folder = DriveApp.getFoldersByName("Uber收據").hasNext()
    ? DriveApp.getFoldersByName("Uber收據").next()
    : DriveApp.createFolder("Uber收據");

  threads.forEach(thread => {
    const msg = thread.getMessages()[0];
    const body = msg.getBody();
    const permalink = thread.getPermalink(); //信件連結
    const attachments = msg.getAttachments();

    // 擷取日期
    const dateMatch = body.match(/(\d{4} 年 \d{1,2} 月 \d{1,2} 日)/);
    const date = dateMatch ? dateMatch[1] : '';

    //費用
    const priceMatch = body.match(/\<span[^>]*?\>\$([\d,.]+)\<\/span\>/);
    const price = priceMatch ? priceMatch[1] : '';

    // 抓出所有地址鏈接文字（地點會放在 <a ...>地址</a> 中）
    const addressMatches = [...body.matchAll(/<a [^>]*?maps\/search[^>]*?>(.*?)<\/a>/g)];
    const start = addressMatches.length > 0 ? addressMatches[0][1].trim() : '';
    const end = addressMatches.length > 1 ? addressMatches[1][1].trim() : '';
    Logger.log(`起點：${start}`);
    Logger.log(`終點：${end}`);

    // 找 PDF 附件
    const hrefMatch = body.match(/<a[^>]+href="(https:\/\/email\.mgt\.uber\.com\/[^"]+)"[^>]*?>[^<]*?PDF<\/a>/i);
    const pdfUrl = hrefMatch ? hrefMatch[1] : '';
    Logger.log("📎 PDF 連結：" + pdfUrl);

    Logger.log(`📬 ${date}, ${start} → ${end}, ${price}`);
    sheet.appendRow([date, start, end, price, permalink, pdfUrl]);
  });
}
