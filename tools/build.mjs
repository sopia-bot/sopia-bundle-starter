import sopiaConfig from '../sopia.config.mjs'
import pkg from '../package.json' with { type: 'json' }
import backgroundPkg from '../apps/background/package.json' with { type: 'json' }
import path from 'path'
import fs from 'fs'
import markdownit from 'markdown-it'

const md = markdownit()

const packageInfo = {
    name: pkg.name,
    'name:ko': pkg['name:ko'],
    description: pkg.description,
    'description:ko': pkg['description:ko'],
    version: pkg.version,
    main: path.posix.join(sopiaConfig.worker.baseDir, sopiaConfig.worker.output.filename),
    page: 'index.html',
    pageRoot: sopiaConfig.views.devServer.use ? sopiaConfig.views.devServer.pageRoot : '',
    pageVersion: 2,
    stp: {
        domain: sopiaConfig.background.domain,
        file: path.posix.join(sopiaConfig.background.baseDir, sopiaConfig.background.output.filename),
    },
    debug: sopiaConfig.production ? false : true,
    dependencies: {
        ...(backgroundPkg.dependencies ?? {}),
        ...(pkg.dependencies ?? {}),
    },
    sopia: sopiaConfig.sopia,
}

if (sopiaConfig.views.devServer.use) {
    packageInfo.pageType = 'http'
    packageInfo.page = 'http://' + sopiaConfig.views.devServer.host + ':' + sopiaConfig.views.devServer.port
}

if ( fs.existsSync('./changelog/') ) {
    packageInfo.releaseNote = {}
    fs.readdirSync('./changelog/').forEach(file => {
        console.log(file)
        if ( file.endsWith('.md') ) {
            packageInfo.releaseNote[file.replace('.md', '')] = md.render(fs.readFileSync('./changelog/' + file, 'utf8')).trim().replace(/\r\n/g, '\n').replace(/\n/g, '<br>')
        }
    })
}

if ( !fs.existsSync('./dist/') ) {
    fs.mkdirSync('./dist/')
}

fs.writeFileSync('./dist/package.json', JSON.stringify(packageInfo, null, 2))