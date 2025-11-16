module.exports = {
	hooks: {
		readPackage(pkg) {
			if (pkg.name === 'electron') {
				// install 시 실행되는 스크립트 제거
				pkg.scripts = {};
			}
			return pkg;
		},
	},
};
