// @ts-ignore
const { ipcRenderer } = window.require('electron');

const DOMAIN = 'dj-board.sopia.dev';
async function backgroundListener(event: any, data: { channel: string; data?: any }): Promise<void> {
    console.log('backgroundListener', data);
    if (!data || !data.channel) return;
    
    switch (data.channel) {
        case 'spoon-login':
            const result = await ipcRenderer.invoke('ext-login-open');
            let errorMsg = '';
            let success = true;
            if (!result.success) {
                errorMsg = '로그인 창을 열 수 없습니다. 다시 시도해주세요.';
                success = false;
            }
            
            // 타입 안전성을 위한 검증
            const rawUserInfo = result.data;
            if (!rawUserInfo || typeof rawUserInfo !== 'object') {
                console.error('Invalid user info received from extension');
                errorMsg = '잘못된 사용자 정보를 받았습니다.';
                success = false;
            }
            
            // 필수 필드 검증
            if (!rawUserInfo.id || !rawUserInfo.token) {
                console.error('Missing required fields in user info');
                errorMsg = '필수 로그인 정보가 누락되었습니다.';
                success = false;
            }
            
            await fetch(`stp://dj-board.sopia.dev/resolve-handshake`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: (data as any)?.id || 'unknown',
                    data: {
                        success: success,
                        errorMsg: errorMsg,
                        userInfo: rawUserInfo,
                    },
                }),
            });
            break;
    }
}

ipcRenderer.on(`${DOMAIN}/renderer`, backgroundListener);

// 종료 핸들러
function onAbort(): void {
    ipcRenderer.removeAllListeners(`${DOMAIN}/renderer`);
    console.log('룰렛 워커가 종료됩니다.');
}

console.log('DJ Board Worker started');

export default {
    onAbort,
}
