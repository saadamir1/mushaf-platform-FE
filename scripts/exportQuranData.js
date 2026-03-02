const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function exportData() {
  try {
    console.log('🔄 Connecting to backend...');
    const api = axios.create({ baseURL: 'http://localhost:3000/api/v1' });

    // Fetch all data
    console.log('📥 Fetching Surahs...');
    const surahsRes = await api.get('/quran/surahs');
    const surahs = surahsRes.data;

    console.log('📥 Fetching Pages...');
    const pagesRes = await api.get('/quran/pages?limit=1027');
    const pages = pagesRes.data?.data || pagesRes.data;

    console.log('📥 Fetching Juz...');
    const juzRes = await api.get('/quran/juz');
    const juz = juzRes.data;

    // Create data directory if not exists
    const dataDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save to files
    console.log('💾 Saving Surahs...');
    fs.writeFileSync(
      path.join(dataDir, 'surahs.json'),
      JSON.stringify(surahs, null, 2)
    );

    console.log('💾 Saving Pages...');
    fs.writeFileSync(
      path.join(dataDir, 'pages.json'),
      JSON.stringify(pages, null, 2)
    );

    console.log('💾 Saving Juz...');
    fs.writeFileSync(
      path.join(dataDir, 'juz.json'),
      JSON.stringify(juz, null, 2)
    );

    console.log('✅ Data exported successfully!');
    console.log(`   - ${surahs.length} Surahs`);
    console.log(`   - ${pages.length} Pages`);
    console.log(`   - ${juz.length} Juz`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('   Make sure backend is running on http://localhost:3000');
    process.exit(1);
  }
}

exportData();
