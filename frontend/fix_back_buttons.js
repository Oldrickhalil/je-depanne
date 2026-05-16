const fs = require('fs');

const filesToChangeHref = [
  'frontend/src/app/dashboard/profile/details/page.tsx',
  'frontend/src/app/dashboard/settings/page.tsx'
];

filesToChangeHref.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/href="\/dashboard" className="flex items-center/g, 'href="/dashboard/profile" className="flex items-center');
  fs.writeFileSync(file, content);
  console.log('Fixed href in', file);
});

const filesToChangeText = [
  'frontend/src/app/admin/loans/page.tsx',
  'frontend/src/app/dashboard/about/page.tsx',
  'frontend/src/app/dashboard/loans/page.tsx',
  'frontend/src/app/dashboard/notifications/page.tsx',
  'frontend/src/app/dashboard/privacy/page.tsx',
  'frontend/src/app/dashboard/profile/details/page.tsx',
  'frontend/src/app/dashboard/schedule/page.tsx',
  'frontend/src/app/dashboard/settings/page.tsx',
  'frontend/src/app/dashboard/stats/page.tsx',
  'frontend/src/app/dashboard/transactions/page.tsx'
];

filesToChangeText.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/(<ArrowLeft size={12} \/>\s*)([^<]*?)(\s*<\/Link>)/gi, '$1Retour$3');
  fs.writeFileSync(file, content);
  console.log('Fixed text in', file);
});
