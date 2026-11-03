import fs from 'fs';
import path from 'path';

const packsDir = path.resolve('public/packs');
if (!fs.existsSync(packsDir)) {
  fs.mkdirSync(packsDir, { recursive: true });
}

const items = [
  { name: 'classic.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700832/Classic_yc0vht.jpg' },
  { name: 'flamin-hot.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700847/Flamin_Hot_l6iopf.jpg' },
  // Let's check Sour_Cream_xkwbgy.jpg vs Cheddar_f3jz45.jpg
  { name: 'sour-cream-xkwbgy.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700897/Sour_Cream_xkwbgy.jpg' },
  { name: 'cheddar-f3jz45.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700817/Cheddar_f3jz45.jpg' },
  { name: 'barbecue.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700797/Barbecue_jclnog.jpg' },
  { name: 'salt-vinegar.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700872/Salt_Vinegar_lvv2hw.jpg' },
  { name: 'all-dressed.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700777/All_Dressed_yotx6g.jpg' },
  { name: 'sweet-southern.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700914/Sweet_Southern_kap4mv.jpg' },
  { name: 'bacon-grilled.jpg', url: 'https://res.cloudinary.com/dwv8kc9vb/image/upload/v1793700784/Bacon_Grilled_ilxokk.jpg' }
];

async function download() {
  for (const item of items) {
    try {
      console.log(`Fetching ${item.name} from ${item.url}...`);
      const res = await fetch(item.url);
      if (!res.ok) {
        console.error(`Failed ${item.name}: ${res.statusText}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(packsDir, item.name), buffer);
      console.log(`Saved ${item.name} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${item.name}:`, err.message);
    }
  }
}

download();

