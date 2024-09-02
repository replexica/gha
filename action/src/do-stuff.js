import fs from 'fs';
import path from 'path';

export default async () => {
  const filePath = path.join(process.cwd(), 'data.json');

  let data = {};
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(fileContent);
  }

  const currentTimestamp = new Date().toISOString();
  data[currentTimestamp] = true;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}