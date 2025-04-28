const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const exePath = app.getPath('exe');

if ( fs.existsSync(path.join(exePath, 'schema.prisma')) ) {
    bunx(['prisma', 'generate'], {cwd: __dirname});
}
