import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/');
  await page.fill('#masterPassword', 'Sakshi5*');
  await page.click('button[type="submit"]');
  
  await page.waitForSelector('text="Skip for now"');
  await page.click('text="Skip for now"');
  
  await page.waitForSelector('text="Documents"');
  await page.click('text="Documents"');
  
  await page.waitForSelector('input[type="file"]');
  await page.setInputFiles('input[type="file"]', '/Users/tejastelkar/Desktop/Docs/Certificates/Coursera Certificate KEXE72VXWLJ6.pdf');
  
  // Wait a bit to see what happens
  await page.waitForTimeout(5000);
  
  // check if rename happened (i.e. if the uploaded file is visible)
  const content = await page.content();
  if (content.includes('KEXE72VXWLJ6')) {
    console.log("Original name still exists");
  } else {
    console.log("Rename seems to have worked");
  }
  
  // print out the document names
  const docs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.document-name, button')).map(e => e.innerText).filter(t => t && t.includes('.pdf'));
  });
  console.log("Documents:", docs);
  
  await browser.close();
})();
