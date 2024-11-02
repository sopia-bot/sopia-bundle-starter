import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

async function bootstrap() {
    const args = process.argv.splice(2);
    const isProdMode = args[0] === 'production';
    const pkgFile = path.join(process.cwd(), 'package.bundle.json');
    const pkgStr = await fs.readFile(pkgFile, 'utf-8');
    const pkg = JSON.parse(pkgStr);

    if ( isProdMode ) {
        pkg.page = 'index.html';
        pkg.debug = false;
    }

    // console.log('is production mode:', isProdMode);

    const dist = path.join(process.cwd(), './dist');
    if ( !existsSync(dist) ) {
        console.error(`Cannot find dist folder: ${dist}`);
        return;
    }

    const targetFile = path.join(dist, 'package.json');
    await fs.writeFile(targetFile, JSON.stringify(pkg, null, '  '), 'utf-8');
}
bootstrap();
