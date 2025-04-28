const path = require('path');

module.exports = {
  entry: './apps/background/src/index.ts', // 엔트리 파일 경로
  output: {
    path: path.resolve(__dirname, '../../dist/apps/background'),
    filename: 'index.js',
    library: {
      type: 'commonjs2', // CommonJS 형식
    },
    libraryExport: 'default', // default 내보내기 활성화
  },
  module: {
    rules: [
        {
            test: /\.ts$/,
            exclude: [/node_modules/],
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
            },
            type: 'javascript/auto',
        },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: [
    // 모든 node_modules를 외부화
    ({ request }, callback) => {
      if (/^[a-zA-Z0-9@][^:]*$/.test(request)) {
        // request가 상대 경로 또는 절대 경로가 아닌 경우(node_modules 모듈)
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ],
  mode: 'development', // 'production', 또는 'development'
  target: 'node',
};
