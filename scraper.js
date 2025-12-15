// scraper.js - Da mettere nella root del repository GitHub

const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🚀 Avvio scraping Simignano...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    console.log('📡 Caricamento pagina CFR...');
    await page.goto('https://cfr.toscana.it/monitoraggio/stazioni.php?type=pluvio', {
        waitUntil: 'networkidle0',
        timeout: 30000
    });
    
    await page.waitForSelector('table');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Estrazione dati...');
    const dati = await page.evaluate(() => {
        const risultati = [];
        const rows = document.querySelectorAll('table tr');
        
        rows.forEach((row, index) => {
            if (index === 0) return;
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;
            
            const raw = Array.from(cells).map(c => c.textContent.trim());
            const testo = raw.join(' ').toLowerCase();
            
            if (testo.includes('simignano')) {
                risultati.push({
                    nome_stazione: raw[1] || '',
                    precipitazioni_1h: raw[5] || '',
                    precipitazioni_6h: raw[6] || '',
                    precipitazioni_12h: raw[7] || '',
                    precipitazioni_24h: raw[8] || '',
                    ultimi_dati: raw[12] || ''
                });
            }
        });
        
        return risultati;
    });
    
    await browser.close();
    
    if (dati.length === 0) {
        console.error('❌ Nessun dato trovato per Simignano');
        process.exit(1);
    }
    
    const output = {
        timestamp: new Date().toISOString(),
        data_aggiornamento: dati[0].ultimi_dati,
        dati: dati
    };
    
    fs.writeFileSync('dati_simignano.json', JSON.stringify(output, null, 2));
    
    console.log('✅ Dati salvati con successo!');
    console.log(`   Stazione: ${dati[0].nome_stazione}`);
    console.log(`   Ultimo aggiornamento: ${dati[0].ultimi_dati}`);
    console.log(`   Precipitazioni 24h: ${dati[0].precipitazioni_24h} mm`);
    
})().catch(error => {
    console.error('❌ Errore:', error);
    process.exit(1);
});
