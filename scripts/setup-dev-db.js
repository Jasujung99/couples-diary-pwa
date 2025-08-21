// 개발용 데이터베이스 설정 스크립트
const fs = require('fs');
const path = require('path');

// SQLite로 임시 스키마 변경 - 빠른 개발 테스트용
const useSqlite = process.argv.includes('--sqlite');
// 인메모리 DB 사용 - 순수 테스트용
const useMemory = process.argv.includes('--memory');

// 기존 스키마 백업
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  fs.writeFileSync(`${schemaPath}.backup`, content);

  // datasource 블록 찾기
  const datasourceMatch = content.match(/datasource\s+db\s+{[^}]+}/);
  if (datasourceMatch) {
    let newContent = content;

    if (useMemory) {
      // 인메모리 SQLite로 교체
      const newDatasource = `datasource db {
  provider = "sqlite"
  url      = "file::memory:?cache=shared"
}`;
      newContent = content.replace(/datasource\s+db\s+{[^}]+}/, newDatasource);
    } else if (useSqlite) {
      // 파일 기반 SQLite로 교체
      const newDatasource = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;
      newContent = content.replace(/datasource\s+db\s+{[^}]+}/, newDatasource);
    }

    if (newContent !== content) {
      fs.writeFileSync(schemaPath, newContent);
      console.log('📝 Prisma schema updated for development');
    }
  }
}

console.log('⚙️ Development database setup complete');
console.log('ℹ️ Now run: npm run db:setup');
