import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { readdir, cp, rm } from 'node:fs/promises';

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const pkgPath = path.join(__dirname, '../package.bundle.json');
const prismaPath = path.join(__dirname, '../prisma');
const migrationsPath = path.join(prismaPath, 'migrations');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const schemaBackupPath = path.join(prismaPath, 'schema-backup');

if ( !fs.existsSync(migrationsPath) ) {
    fs.mkdirSync(migrationsPath);
}

export async function getSchemaList() {
    const entries = await readdir(schemaBackupPath);
    return entries.filter((entry) => /^\d{14}_version_\d+\.\d+\.\d+\.prisma$/.test(entry))
        .sort((a, b) => {
            const adate = +a.substring(0, 14);
            const bdate = +b.substring(0, 14);
            return bdate - adate;
        })
        .map((entry) => path.join(schemaBackupPath, entry));
}

export function dateSurffix(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = (date.getDate()).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minute}${seconds}`;
}

const prismaCmd = path.join(__dirname, '../node_modules/.bin/', os.platform() === 'win32' ? 'prisma.CMD' : 'prisma');
export function createMigrationScript() {
    return new Promise(async (resolve, reject) => {

        let emptyFlag = true;
        let fromSchema = '';
        if ( fs.existsSync(schemaBackupPath) ) {
            const schemaBackupList = await getSchemaList()
            if ( schemaBackupList.length ) {
                fromSchema = schemaBackupList[0];
                emptyFlag = false;
            }
        }
        const schemaPath = path.join(prismaPath, 'schema.prisma');
        console.log('INFO: ', emptyFlag ? 'empty' : fromSchema);
        console.log('INFO: ', schemaPath);

        const ps = spawn(prismaCmd, [
            'migrate',
            'diff',
            ...(emptyFlag ? ['--from-empty'] : ['--from-schema-datamodel', fromSchema]),
            '--to-schema-datamodel',
            schemaPath,
            '--script',
        ], {
            shell: true,
        });

        const migPath = path.join(migrationsPath, `${dateSurffix(new Date())}_version_${pkg.version}.sql`);
        const stream = fs.createWriteStream(migPath);

        ps.stdout.pipe(stream);
        ps.stderr.pipe(process.stderr);

        ps.on('close', () => {
            //organize();
            stream.close();
            resolve();
        });
        ps.on('error', reject);
    });
}

export async function prismaBuild() {
    const prismaPath = path.join(__dirname, '../prisma');

    try {
        const schemaList = await getSchemaList();
        let migFlag = true;
        for ( const schema of schemaList ) {
            const m = schema.match(/version_(.*?)\.prisma/);
            if ( m ) {
                const version = m[1];
                if ( pkg.version === version ) {
                    console.error(`INFO: 현재 버전과 같은 백업본이 있어 빌드하지 않습니다.`);
                    migFlag = false;
                }
            }
        }

        if ( migFlag ) {
            await createMigrationScript();

            await cp(
                path.join(prismaPath, 'schema.prisma'),
                path.join(prismaPath, 'schema-backup', `${dateSurffix(new Date())}_version_${pkg.version}.prisma`),
            );
        }

        const dist = path.join(__dirname, '../dist/migrations');
        if ( fs.existsSync(dist) ) {
            await rm(dist, { recursive: true });
        }
        await cp(
            migrationsPath,
            dist,
            {
                recursive: true,
            }
        );
    } catch(err) {
        console.error(err);
    }
}