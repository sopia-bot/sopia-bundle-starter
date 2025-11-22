console.log('NODE_ENV', process.env.NODE_ENV)
export default {
    background: {
        domain: 'dj-board.sopia.dev',
        baseDir: 'apps/background',
        entry: 'index.ts',
        output: {
            path: 'dist/apps/background',
            filename: 'index.js',
        },
    },
    views: {
        baseDir: 'apps/views',
        entry: 'index.ts',
        devServer: {
            use: process.env.NODE_ENV !== 'production',
            port: 4200,
            host: 'localhost',
        },
        output: {
            path: 'dist/apps/views',
        },
    },
    worker: {
        baseDir: 'apps/worker',
        entry: 'index.ts',
        output: {
            path: 'dist/apps/worker',
            filename: 'index.js',
        },
    },
    sopia: {
        ignore: {
            upload: [
                'node_modules',
                'migrated'
            ],
            fetch: [],
        }
    },
    production: process.env.NODE_ENV === 'production',
}