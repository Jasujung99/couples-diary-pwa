"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fadeInUp } from "@/utils/animations";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

const errorMessages: Record<string, string> = {
  Configuration: "서버 설정에 문제가 있습니다.",
  AccessDenied: "접근이 거부되었습니다.",
  Verification: "인증 링크가 만료되었거나 이미 사용되었습니다.",
  Default: "인증 중 오류가 발생했습니다.",
  OAuthSignin: "소셜 로그인 연결에 실패했습니다.",
  OAuthCallback: "인증 과정에서 오류가 발생했습니다.",
  OAuthCreateAccount: "계정 생성 중 오류가 발생했습니다.",
  EmailCreateAccount: "이메일 계정 생성에 실패했습니다.",
  Callback: "로그인 콜백 처리 중 오류가 발생했습니다.",
  OAuthAccountNotLinked: "이미 다른 방법으로 가입된 이메일입니다.",
  EmailSignin: "이메일 로그인에 실패했습니다.",
  CredentialsSignin: "로그인 정보가 올바르지 않습니다.",
  SessionRequired: "로그인이 필요합니다.",
};

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setError(errorMessages[errorParam] || errorMessages.Default);
    } else {
      setError(errorMessages.Default);
    }
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/auth');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center"
        >
          {/* Error icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full mb-6"
          >
            <AlertCircle className="w-10 h-10 text-red-500" />
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-ink mb-4">
            로그인 오류
          </h1>

          {/* Error message */}
          <Card className="p-6 mb-8 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
            <p className="text-red-700 dark:text-red-300 text-center">
              {error}
            </p>
          </Card>

          {/* Action buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleRetry}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-ink/50 mt-8 leading-relaxed">
            문제가 계속 발생하면 브라우저의 쿠키와 캐시를 삭제한 후 다시 시도해보세요.
          </p>
        </motion.div>
      </div>
    </div>
  );
}