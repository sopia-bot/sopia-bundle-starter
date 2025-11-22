'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { debounce } from 'lodash';
import { normalizeNodeId } from 'platejs';
import type { TNode } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { EditorKit } from '@/components/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { fetchPage, fetchPageList, savePage, deletePage, spoonLogin, saveUserInfo, loadUserInfo, clearUserInfo, checkUserPermission, type UserInfo, type PageListItem } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlertIcon, SquarePenIcon } from 'lucide-react';

const PAGE_DOMAIN = 'https://sopia.dev';

// 초기 데이터
const initialValue = normalizeNodeId([
  {
    children: [{ text: '🎵 당신을 위한 DJ 보드 에디터' }],
    type: 'h1',
  },
  {
    children: [
      { text: '노션과 비슷한 느낌으로 작성할 수 있습니다.' },
      { text: '다양한 기능을 지원합니다:' },
    ],
    type: 'p',
  },
  {
    children: [
      {
        children: [
          {
            children: [{ text: '📝 텍스트 포맷팅: 볼드, 이탤릭, 밑줄, 취소선 등' }],
            type: 'lic',
          },
        ],
        type: 'li',
      },
      {
        children: [
          {
            children: [{ text: '🎨 다양한 블록 타입: 헤딩, 리스트, 블록쿼트, 코드 블록' }],
            type: 'lic',
          },
        ],
        type: 'li',
      },
      {
        children: [
          {
            children: [{ text: '🔗 링크, 이미지, 테이블 지원' }],
            type: 'lic',
          },
        ],
        type: 'li',
      },
      {
        children: [
          {
            children: [{ text: '💾 실시간 자동 저장' }],
            type: 'lic',
          },
        ],
        type: 'li',
      },
    ],
    type: 'ul',
  },
  {
    children: [{ text: '' }],
    type: 'p',
  },
  {
    children: [{ text: '빠른 기능 사용법' }],
    type: 'h2',
  },
  {
    children: [
      { text: '/ 슬래시 명령어', code: true },
      { text: '를 입력하여 빠르게 블록을 추가할 수 있습니다.' },
    ],
    type: 'p',
  },
  {
    children: [
      { text: '텍스트를 선택하면 플로팅 툴바가 나타나 포맷팅할 수 있습니다.' },
    ],
    type: 'p',
  },
  {
    children: [{ text: '코드 예제' }],
    type: 'h2',
  },
  {
    children: [
      {
        children: [{ text: 'function hello() {\n  console.log("Hello, Plate!");\n}' }],
        type: 'code_line',
      },
    ],
    lang: 'javascript',
    type: 'code_block',
  },
  {
    children: [{ text: '' }],
    type: 'p',
  },
  {
    children: [
      {
        children: [{ text: '팁: 이 에디터는 자동으로 저장됩니다. 별도의 저장 버튼을 누를 필요가 없습니다!' }],
        type: 'p',
      },
    ],
    type: 'callout',
    variant: 'info',
  },
]);

// 에디터 컨텐츠에서 첫 번째 제목 추출
function extractFirstHeading(content: TNode[]): string {
  for (const node of content) {
    // Element 노드인지 확인
    if ('type' in node && 'children' in node) {
      const nodeType = (node as any).type;
      const nodeChildren = (node as any).children;
      
      // h1, h2, h3, h4, h5, h6 체크
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(nodeType)) {
        // children에서 텍스트 추출
        const text = nodeChildren
          .map((child: any) => ('text' in child ? child.text : ''))
          .join('')
          .trim();
        
        if (text) {
          return text;
        }
      }
    }
  }
  
  return 'Untitled';
}

// stp:// 프로토콜로 Background 서버를 통해 저장
async function saveToBackend(
  content: TNode[], 
  title: string = 'Untitled', 
  userId?: number, 
  url?: string,
  onSuccess?: () => void
) {
  const result = await savePage(content, title, userId, url);
  
  if (result) {
    if (onSuccess) onSuccess();
    return { success: true, userId: result.userId };
  }
  
  return { success: false, error: 'Failed to save' };
}

export default function Home() {
  const { pageUrl } = useParams<{ pageUrl?: string }>();
  const navigate = useNavigate();
  const lastSavedRef = useRef<string>('');
  const isFirstLoadRef = useRef(true); // 최초 로딩 체크
  const [pageTitle, setPageTitle] = useState<string>('DJ Board CMS');
  
  // pageUrl이 'index.html'이면 undefined로 처리 (메인 페이지)
  const normalizedPageUrl = pageUrl === 'index.html' ? undefined : pageUrl;
  const [currentPageUrl, setCurrentPageUrl] = useState<string | undefined>(normalizedPageUrl);
  
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);
  const [pageList, setPageList] = useState<PageListItem[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{ url: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unauthorizedDialogOpen, setUnauthorizedDialogOpen] = useState(false);

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  });

  // 페이지 리스트 새로고침
  const refreshPageList = useCallback(async () => {
    if (!userInfo) return;
    
    const userId = parseInt(userInfo.id);
    const res = await fetchPageList(userId);
    
    if (res && res.data) {
      setPageList(res.data);
    }
  }, [userInfo]);

  // Debounce된 저장 함수 (2초 대기)
  const debouncedSave = useCallback(
    debounce((content: TNode[], title: string, userId?: number, url?: string) => {
      const contentString = JSON.stringify(content);
      
      // 내용이 실제로 변경된 경우에만 저장
      if (contentString !== lastSavedRef.current) {
        lastSavedRef.current = contentString;
        saveToBackend(content, title, userId, url, refreshPageList);
      }
    }, 2000),
    [refreshPageList]
  );

  // 에디터 값 변경 핸들러
  const handleEditorChange = useCallback(({ value }: { value: TNode[] }) => {
    // 최초 로딩 중이거나 첫 로딩인 경우 저장하지 않음
    if (isLoading || isFirstLoadRef.current) {
      return;
    }
    
    // 첫 번째 제목 추출하여 페이지 제목 업데이트
    const newTitle = extractFirstHeading(value);
    setPageTitle(newTitle);
    
    // 에디터 값 변경 시 자동 저장
    const userId = userInfo ? parseInt(userInfo.id) : undefined;
    debouncedSave(value, newTitle, userId, currentPageUrl);
  }, [isLoading, debouncedSave, userInfo, currentPageUrl]);

  // 페이지 삭제 확인 다이얼로그 열기
  const handleDeleteClick = useCallback((page: { url: string; title: string }) => {
    setPageToDelete(page);
    setDeleteConfirmOpen(true);
  }, []);

  // 페이지 삭제 실행
  const handleDeleteConfirm = useCallback(async () => {
    if (!pageToDelete || !userInfo) return;
    
    setIsDeleting(true);
    
    try {
      const userId = parseInt(userInfo.id);
      const result = await deletePage(userId, pageToDelete.url);
      
      if (result.success) {
        console.log('✅ Page deleted:', pageToDelete.title);
        
        // 삭제된 페이지가 현재 페이지인 경우 메인 페이지로 이동
        if (currentPageUrl === pageToDelete.url) {
          navigate('/');
        }
        
        // 페이지 리스트 새로고침
        await refreshPageList();
        
        // 다이얼로그 닫기
        setDeleteConfirmOpen(false);
        setPageToDelete(null);
      } else {
        // 삭제 실패
        setErrorMessage(result.error || '페이지 삭제에 실패했습니다.');
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('❌ Error deleting page:', error);
      setErrorMessage('페이지 삭제 중 오류가 발생했습니다.');
      setErrorDialogOpen(true);
    } finally {
      setIsDeleting(false);
    }
  }, [pageToDelete, userInfo, currentPageUrl, navigate, refreshPageList]);

  // 사용자 정보 로드 및 권한 확인
  useEffect(() => {
    const checkAndLoadUser = async () => {
      const savedUserInfo = loadUserInfo();
      if (savedUserInfo) {
        // 권한 확인 (특정 사용자의 팔로잉 목록에 있는지 체크)
        const TARGET_USER_ID = '4324890'; // 체크할 대상 사용자 ID
        const permissionCheck = await checkUserPermission(TARGET_USER_ID, savedUserInfo.id);
        
        if (permissionCheck.allowed) {
          setUserInfo(savedUserInfo);
        } else {
          // 권한 없음 - 다이얼로그 표시 후 로그아웃
          console.warn('⚠️ Unauthorized user detected');
          setUnauthorizedDialogOpen(true);
          clearUserInfo();
        }
      }
    };
    
    checkAndLoadUser();
  }, []);

  // 페이지 리스트 로드
  useEffect(() => {
    const loadPageList = async () => {
      if (!userInfo) return;
      
      const userId = parseInt(userInfo.id);
      const res = await fetchPageList(userId);
      
      if (res && res.data) {
        setPageList(res.data);
      }
    };

    loadPageList();
  }, [userInfo]);

  // URL 파라미터 변경 감지
  useEffect(() => {
    // index.html을 메인 페이지로 처리
    const normalized = pageUrl === 'index.html' ? undefined : pageUrl;
    console.log(`🔄 URL parameter changed - pageUrl: ${pageUrl || '(main page)'}, normalized: ${normalized || '(main page)'}`);
    setCurrentPageUrl(normalized);
  }, [pageUrl]);

  // 페이지 로드
  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      
      // 로그인된 경우에만 페이지 로드
      if (!userInfo) {
        setIsLoading(false);
        return;
      }
      
      const userId = parseInt(userInfo.id);
      const res = await fetchPage(userId, currentPageUrl);
      
      const data = res?.data?.[0] || null;
      if (data) {
        console.log('📄 Loading saved content');
        editor.tf.setValue(normalizeNodeId(data.content as any) as any);
        
        // 컨텐츠에서 첫 번째 제목 추출 (저장된 title이 있으면 우선 사용)
        const extractedTitle = extractFirstHeading(data.content);
        setPageTitle(data.title || extractedTitle);
        
        // 초기 값을 lastSavedRef에 저장
        lastSavedRef.current = JSON.stringify(data.content);
      } else {
        console.log('📄 No saved content, using initial value');
        // 404 또는 content가 없을 때 기본값 설정
        editor.tf.setValue(normalizeNodeId(initialValue as any) as any);
        
        // 초기값에서 첫 번째 제목 추출
        const extractedTitle = extractFirstHeading(initialValue);
        setPageTitle(extractedTitle);
        
        // 초기값 저장
        lastSavedRef.current = JSON.stringify(initialValue);
      }
      
      setIsLoading(false);
      
      // 로딩 완료 후 첫 로딩 플래그 해제
      setTimeout(() => {
        isFirstLoadRef.current = false;
      }, 100);
    };

    loadPage();
  }, [userInfo, currentPageUrl]);


  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* 왼쪽 사이드바 - 페이지 리스트 */}
      {userInfo && (
        <div className="w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">페이지</h2>
              <button
                onClick={() => navigate('/')}
                className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors ${
                  !currentPageUrl ? 'bg-accent' : ''
                }`}
              >
                🏠 메인 페이지
              </button>
            </div>
            
            {pageList.filter(page => page.url !== '/' && page.url !== '').length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">모든 페이지</h3>
                <div className="space-y-1">
                  {pageList
                    .filter((page) => page.url !== '/' && page.url !== '') // 메인 페이지 제외
                    .map((page) => {
                      const targetPath = `/${page.url}`;
                      const isActive = currentPageUrl === page.url;
                      
                      return (
                        <div
                          key={page.url}
                          className={`flex items-center gap-2 group rounded-md hover:bg-accent transition-colors ${
                            isActive ? 'bg-accent' : ''
                          }`}
                        >
                          <button
                            onClick={() => navigate(targetPath)}
                            className="flex-1 text-left px-3 py-2 text-sm truncate"
                            title={page.title}
                          >
                            📄 {page.title}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(page);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-2 hover:bg-red-100 hover:text-red-600 rounded"
                            title="페이지 삭제"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[960px] px-6 py-4">
          <div className="mb-3 flex items-center gap-2">
            <SquarePenIcon className="size-6 text-emerald-500" />
            <h1 className="text-lg font-semibold">DJ 보드 에디터</h1>
          </div>
          
          {/* DJ 계정 로그인 / 사용자 정보 */}
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              DJ 계정 인증
            </label>
            
            {userInfo ? (
              // 로그인된 경우 - 사용자 정보 표시
              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
                  <img
                    src={userInfo.profile_url}
                    alt={userInfo.nickname}
                    className="size-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{userInfo.nickname}</span>
                      <span className="text-xs text-muted-foreground">#{userInfo.tag}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ID: {userInfo.id}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      clearUserInfo();
                      setUserInfo(null);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    로그아웃
                  </button>
                </div>
                
                {/* 사이트 주소 */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const urlPath = currentPageUrl || '';
                      const url = `${PAGE_DOMAIN}/d/${userInfo.id}/${urlPath}`;
                      navigator.clipboard.writeText(url).then(() => {
                        console.log('✅ URL 복사됨:', url);
                        setUrlCopied(true);
                        setTimeout(() => setUrlCopied(false), 2000);
                      }).catch((err) => {
                        console.error('❌ URL 복사 실패:', err);
                      });
                    }}
                    className={`w-full rounded-md border px-3 py-2 text-left text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      urlCopied
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    title="클릭하여 복사"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {PAGE_DOMAIN}/d/{userInfo.id}/{currentPageUrl || ''}
                      </span>
                      {urlCopied && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          복사됨!
                        </span>
                      )}
                    </div>
                  </button>
                  <p className="text-xs text-muted-foreground">
                    위 주소를 클릭하면 클립보드에 복사됩니다
                  </p>
                </div>
              </div>
            ) : (
              // 로그인되지 않은 경우 - 로그인 버튼
              <>
                <button
                  onClick={async () => {
                    const response = await spoonLogin();
                    if (response.success && response.userInfo) {
                      // 로그인 성공 - 권한 확인
                      const TARGET_USER_ID = '4324890';
                      const permissionCheck = await checkUserPermission(TARGET_USER_ID, response.userInfo.id);
                      
                      if (permissionCheck.allowed) {
                        // 권한 있음 - 로그인 진행
                        saveUserInfo(response.userInfo);
                        setUserInfo(response.userInfo);
                        console.log('✅ DJ 로그인 성공');
                      } else {
                        // 권한 없음 - 로그인 거부
                        console.warn('⚠️ Unauthorized user:', response.userInfo.nickname);
                        setUnauthorizedDialogOpen(true);
                      }
                    } else {
                      // 로그인 실패
                      setErrorMessage(response.errorMsg || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
                      setErrorDialogOpen(true);
                      console.error('❌ DJ 로그인 실패:', response.errorMsg);
                    }
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-500 px-6 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  DJ 계정 로그인
                </button>
                <p className="mt-2 text-xs text-muted-foreground">
                  스푼 라디오 DJ 계정으로 로그인합니다
                </p>
              </>
            )}
          </div>
        </div>
      </div>

        {/* 에디터 영역 */}
        {userInfo ? (
          <div className="flex-1 overflow-auto bg-muted/10">
            <Plate editor={editor} onChange={handleEditorChange}>
              <EditorContainer className="h-full">
              <Editor 
                variant="demo" 
                className="h-full px-[96px] py-16"
                placeholder="여기에 내용을 입력하세요..."
              />
              </EditorContainer>
            </Plate>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center space-y-4">
              <ShieldAlertIcon className="mx-auto size-16 text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  로그인이 필요합니다
                </h2>
                <p className="text-sm text-muted-foreground">
                  에디터를 사용하려면 상단에서 DJ 계정으로 로그인해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 에러 다이얼로그 */}
        <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>오류</DialogTitle>
              <DialogDescription>
                {errorMessage}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* 페이지 삭제 확인 다이얼로그 */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>페이지 삭제</DialogTitle>
              <DialogDescription>
                정말로 <strong className="text-foreground">"{pageToDelete?.title}"</strong> 페이지를 삭제하시겠습니까?
                <br />
                <br />
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  ⚠️ 페이지의 모든 내용이 영구적으로 삭제되며 되돌릴 수 없습니다.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPageToDelete(null);
                }}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 권한 없음 다이얼로그 */}
        <Dialog open={unauthorizedDialogOpen} onOpenChange={setUnauthorizedDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>접근 거부</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="text-red-600 dark:text-red-400 font-semibold">
                ⚠️ 허용되지 않은 계정입니다.
              </div>
              <div className="text-sm text-muted-foreground">
                이 에디터는 파트너 DJ 사용자만 사용할 수 있습니다.
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setUnauthorizedDialogOpen(false);
                }}
              >
                확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

