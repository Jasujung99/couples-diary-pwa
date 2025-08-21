'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function AuthDebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookies, setCookies] = useState<string[]>([]);

  useEffect(() => {
    setCookies(document.cookie.split(';').map(c => c.trim()));
  }, []);

  const clearAuthState = async () => {
    try {
      // 서버 측 인증 상태 초기화
      await fetch('/api/auth/clear-auth-state');

      // 로컬 스토리지 및 세션 스토리지 초기화
      localStorage.clear();
      sessionStorage.clear();

      // 클라이언트 측 로그아웃
      await signOut({ redirect: false });

      // 페이지 새로고침
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('인증 상태 초기화 실패:', error);
      alert('인증 상태 초기화에 실패했습니다.');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">인증 디버깅</h1>

      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">인증 상태</h2>
        <p className="mb-2">상태: <strong>{status}</strong></p>
        {session ? (
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40 text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        ) : (
          <p>세션 없음</p>
        )}
      </Card>

      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">쿠키</h2>
        <ul className="text-xs">
          {cookies.map((cookie, i) => (
            <li key={i} className="mb-1">{cookie}</li>
          ))}
        </ul>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">작업</h2>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => router.push('/auth/signin')}
            variant="outline"
          >
            로그인 페이지로
          </Button>

          <Button
            onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
            variant="outline"
          >
            로그아웃
          </Button>

          <Button
            onClick={clearAuthState}
            variant="destructive"
          >
            인증 상태 초기화
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            페이지 새로고침
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">문제 해결 단계</h3>
        <ol className="list-decimal ml-6 space-y-2">
          <li>인증 상태를 <strong>초기화</strong>하세요</li>
          <li>새 탭에서 <strong>시크릿 모드로</strong> 시도해보세요</li>
          <li>서비스 워커 문제가 의심된다면, 브라우저 설정에서 <strong>사이트 데이터 삭제</strong>를 시도하세요</li>
          <li>로그인 시 <strong>단순 리디렉션 방식</strong>을 사용하세요(redirect: true)</li>
          <li>환경 변수가 올바르게 설정되었는지 확인하세요(NEXTAUTH_URL, SECRET 등)</li>
        </ol>
      </div>
    </div>
  );
}
