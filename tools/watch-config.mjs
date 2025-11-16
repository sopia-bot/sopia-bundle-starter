import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const filesToWatch = [
    'package.json',
    'sopia.config.mjs',
    'apps/background/package.json'
]

let isBuilding = false
let needsRebuild = false

function runBuild() {
    if (isBuilding) {
        needsRebuild = true
        return
    }

    isBuilding = true
    console.log('\n🔨 Running build.mjs...')
    
    const buildProcess = spawn('node', ['tools/build.mjs'], {
        stdio: 'inherit',
        shell: true
    })

    buildProcess.on('close', (code) => {
        isBuilding = false
        if (code === 0) {
            console.log('✅ Build completed successfully\n')
        } else {
            console.error('❌ Build failed\n')
        }

        if (needsRebuild) {
            needsRebuild = false
            runBuild()
        }
    })
}

console.log('👀 Watching for config changes...')
console.log('Watching files:')
filesToWatch.forEach(file => console.log(`  - ${file}`))
console.log('')

// Initial build
runBuild()

// Watch files
filesToWatch.forEach(file => {
    const fullPath = path.resolve(file)
    
    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  Warning: ${file} does not exist`)
        return
    }

    fs.watch(fullPath, (eventType) => {
        if (eventType === 'change') {
            console.log(`📝 Detected change in ${file}`)
            runBuild()
        }
    })
})

console.log('✨ Watching started. Press Ctrl+C to stop.\n')

