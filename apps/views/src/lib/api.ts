/**
 * DJ Board CMS API Client
 * stp:// 프로토콜을 사용하여 Background 서버와 통신
 */

import type { TNode } from 'platejs';

const BACKGROUND_URL = 'stp://dj-board.sopia.dev';
const USER_ID = 2; // 고정된 사용자 ID

interface ApiResponse<T> {
  msg: string;
  data: T[];
  status: number;
  error: boolean;
}

export interface UserInfo {
  nickname: string;
  profile_url: string;
  id: string;
  tag: string;
}

export interface SpoonLoginResponse {
  success: boolean;
  errorMsg?: string;
  userInfo?: UserInfo;
}

export interface SpoonFollowing {
  id: number;
  nickname: string;
  tag: string;
  profile_url: string;
  // ... 기타 필드
}

export interface SpoonFollowingsResponse {
  status_code: number;
  detail: string;
  next: string;
  previous: string;
  results: SpoonFollowing[];
}

export interface PageData {
  userId: number;
  title: string;
  content: TNode[];
  url?: string;
  updatedAt?: string;
}

export interface PageListItem {
  userId: number;
  title: string;
  url: string;
  updatedAt?: string;
}

export interface SavePageRequest {
  userId: number;
  title: string;
  content: TNode[];
  url?: string;
}

export interface SavePageResponse {
  success: boolean;
  userId: number;
}

/**
 * 페이지 리스트 조회
 * stp://dj-board.sopia.dev/pages/list/:userId
 */
export async function fetchPageList(userId: number = USER_ID): Promise<ApiResponse<PageListItem> | null> {
  try {
    console.log(`📡 Fetching page list for userId: ${userId}`);
    
    const response = await fetch(`${BACKGROUND_URL}/api/dj-board/pages/list/${userId}`);
    
    if (response.status === 404) {
      console.log('📄 No pages found (404)');
      return { 
        data: [], 
        msg: 'No pages found', 
        status: 404, 
        error: false 
      };
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Page list loaded:', data.data?.length || 0, 'pages');
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching page list:', error);
    return { 
      data: [], 
      msg: 'Error fetching page list', 
      status: 500, 
      error: true 
    };
  }
}

/**
 * 페이지 조회
 * stp://dj-board.sopia.dev/pages/:userId 또는 stp://dj-board.sopia.dev/pages/:userId/:url
 */
export async function fetchPage(userId: number = USER_ID, url?: string): Promise<ApiResponse<PageData> | null> {
  try {
    // url이 없거나 빈 문자열이면 메인 페이지
    const endpoint = url 
      ? `${BACKGROUND_URL}/api/dj-board/pages/${userId}/${url}`
      : `${BACKGROUND_URL}/api/dj-board/pages/${userId}`;
    
    console.log(`📡 Fetching page for userId: ${userId}, url: ${url || '(main)'}`);
    
    const response = await fetch(endpoint);
    
    if (response.status === 404) {
      console.log('📄 Page not found (404)');
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Page loaded successfully');
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching page:', error);
    return null;
  }
}

/**
 * 페이지 저장
 * stp://dj-board.sopia.dev/pages
 */
export async function savePage(
  content: TNode[],
  title: string = 'Untitled',
  userId: number = USER_ID,
  url?: string
): Promise<SavePageResponse | null> {
  try {
    console.log(`💾 Saving page for userId: ${userId}`);
    console.log(`📊 Content size: ${JSON.stringify(content).length} bytes`);
    
    const payload: SavePageRequest = {
      userId,
      title,
      content,
      url,
    };
    
    const response = await fetch(`${BACKGROUND_URL}/api/dj-board/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: SavePageResponse = await response.json();
    console.log('✅ Page saved successfully');
    
    return data;
  } catch (error) {
    console.error('❌ Error saving page:', error);
    return null;
  }
}

/**
 * 페이지 삭제
 * DELETE stp://dj-board.sopia.dev/pages
 */
export async function deletePage(
  userId: number,
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🗑️ Deleting page for userId: ${userId}, url: ${url}`);
    
    const response = await fetch(`${BACKGROUND_URL}/api/dj-board/pages`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, url }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    await response.json();
    console.log('✅ Page deleted successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting page:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
}

/**
 * 스푼 로그인
 * POST stp://dj-board.sopia.dev/user/spoon-login
 */
export async function spoonLogin(): Promise<SpoonLoginResponse> {
  try {
    console.log('🔐 Requesting Spoon login...');
    
    const response = await fetch(`${BACKGROUND_URL}/user/spoon-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: SpoonLoginResponse = await response.json();
    console.log('✅ Spoon login response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error requesting Spoon login:', error);
    return {
      success: false,
      errorMsg: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    };
  }
}

/**
 * localStorage에 사용자 정보 저장
 */
export function saveUserInfo(userInfo: UserInfo): void {
  localStorage.setItem('dj_user_nickname', userInfo.nickname);
  localStorage.setItem('dj_user_profile_url', userInfo.profile_url);
  localStorage.setItem('dj_user_id', userInfo.id);
  localStorage.setItem('dj_user_tag', userInfo.tag);
}

/**
 * localStorage에서 사용자 정보 불러오기
 */
export function loadUserInfo(): UserInfo | null {
  const nickname = localStorage.getItem('dj_user_nickname');
  const profile_url = localStorage.getItem('dj_user_profile_url');
  const id = localStorage.getItem('dj_user_id');
  const tag = localStorage.getItem('dj_user_tag');
  
  if (nickname && profile_url && id && tag) {
    return { nickname, profile_url, id, tag };
  }
  
  return null;
}

/**
 * localStorage에서 사용자 정보 삭제
 */
export function clearUserInfo(): void {
  localStorage.removeItem('dj_user_nickname');
  localStorage.removeItem('dj_user_profile_url');
  localStorage.removeItem('dj_user_id');
  localStorage.removeItem('dj_user_tag');
}

/**
 * 특정 사용자의 팔로잉 목록 조회 (권한 확인용)
 * GET https://kr-api.spooncast.net/users/{userId}/followings/
 */
export async function checkUserPermission(
  targetUserId: string,
  checkUserId: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    console.log(`🔍 Checking permission for user ${checkUserId} in ${targetUserId}'s followings`);
    
    const response = await fetch(`https://kr-api.spooncast.net/users/${targetUserId}/followings/`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: SpoonFollowingsResponse = await response.json();
    console.log('data', checkUserId, data, typeof checkUserId);
    
    // results 배열에서 로그인한 사용자 ID 찾기
    const isAllowed = data.results.some((user) => user.id.toString() === checkUserId.toString());
    
    if (isAllowed) {
      console.log('✅ User is allowed');
    } else {
      console.log('❌ User is not in the followings list');
    }
    
    return { allowed: isAllowed };
  } catch (error) {
    console.error('❌ Error checking user permission:', error);
    return {
      allowed: false,
      error: error instanceof Error ? error.message : '권한 확인 중 오류가 발생했습니다',
    };
  }
}

// ============================================================
// DataTable API
// ============================================================

export interface DataTableColumn {
  id: number;
  name: string;
}

export interface DataTableData {
  [key: string]: string; // column1, column2, ...
}

export interface SaveDataTableRequest {
  tid: string;
  name: string;
  columns: DataTableColumn[];
  data: DataTableData[];
  userId?: number;
  url?: string;
}

export interface SaveDataTableResponse {
  success: boolean;
  idx: number;
  tid: string;
}

export interface FetchDataTableResponse {
  idx: number;
  user_id: number;
  tid: string;
  name: string;
  columns: DataTableColumn[];
  reg_date: string;
  update_date: string;
  data: (DataTableData & { id: number; reg_date: string })[];
}

export interface DeleteDataTableResponse {
  success: boolean;
  tid: string;
}

/**
 * 데이터 테이블 저장 (생성/업데이트)
 * POST stp://dj-board.sopia.dev/data-table/
 */
export async function saveDataTable(
  request: SaveDataTableRequest
): Promise<SaveDataTableResponse> {
  try {
    console.log(`💾 Saving DataTable: ${request.name} (tid: ${request.tid})`);
    
    const response = await fetch(`${BACKGROUND_URL}/data-table/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<SaveDataTableResponse> = await response.json();
    console.log('✅ DataTable saved successfully:', result);
    
    return result.data[0];
  } catch (error) {
    console.error('❌ Error saving DataTable:', error);
    throw error;
  }
}

/**
 * 데이터 테이블 조회 (tid)
 * GET stp://dj-board.sopia.dev/data-table/:tid
 */
export async function fetchDataTable(
  tid: string
): Promise<FetchDataTableResponse | null> {
  try {
    console.log(`📡 Fetching DataTable: ${tid}`);
    
    const response = await fetch(`${BACKGROUND_URL}/data-table/${tid}`);
    
    if (response.status === 404) {
      console.log('📄 DataTable not found (404)');
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<FetchDataTableResponse> = await response.json();
    console.log('✅ DataTable loaded successfully');
    
    return result.data[0];
  } catch (error) {
    console.error('❌ Error fetching DataTable:', error);
    return null;
  }
}

/**
 * 데이터 테이블 삭제
 * DELETE stp://dj-board.sopia.dev/data-table/:tid
 */
export async function deleteDataTable(
  tid: string
): Promise<DeleteDataTableResponse | null> {
  try {
    console.log(`🗑️ Deleting DataTable: ${tid}`);
    
    const response = await fetch(`${BACKGROUND_URL}/data-table/${tid}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<DeleteDataTableResponse> = await response.json();
    console.log('✅ DataTable deleted successfully');
    
    return result.data[0];
  } catch (error) {
    console.error('❌ Error deleting DataTable:', error);
    return null;
  }
}

