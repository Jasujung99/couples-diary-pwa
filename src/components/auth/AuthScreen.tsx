"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fadeInUp, scaleIn, getTransition } from "@/utils/animations";
import { Heart, AlertCircle, Loader2 } from "lucide-react";

interface AuthScreenProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface AuthError {
  message: string;
  type: 'error' | 'warning';
}

export function AuthScreen({ onSuccess, onError }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<AuthError | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      setIsLoading(provider);
      setError(null);

      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        let errorMessage = "로그인 중 오류가 발생했습니다.";
        
        switch (result.error) {
          case "OAuthSignin":
            errorMessage = "소셜 로그인 연결에 실패했습니다.";
            break;
          case "OAuthCallback":
            errorMessage = "인증 과정에서 오류가 발생했습니다.";
            break;
          case "OAuthCreateAccount":
            errorMessage = "계정 생성 중 오류가 발생했습니다.";
            break;
          case "EmailCreateAccount":
            errorMessage = "이메일 계정 생성에 실패했습니다.";
            break;
          case "Callback":
            errorMessage = "로그인 콜백 처리 중 오류가 발생했습니다.";
            break;
          case "OAuthAccountNotLinked":
            errorMessage = "이미 다른 방법으로 가입된 이메일입니다.";
            break;
          case "EmailSignin":
            errorMessage = "이메일 로그인에 실패했습니다.";
            break;
          case "CredentialsSignin":
            errorMessage = "로그인 정보가 올바르지 않습니다.";
            break;
          case "SessionRequired":
            errorMessage = "로그인이 필요합니다.";
            break;
          default:
            errorMessage = result.error;
        }

        setError({
          message: errorMessage,
          type: 'error'
        });
        onError?.(errorMessage);
      } else if (result?.ok) {
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
      setError({
        message: errorMessage,
        type: 'error'
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial={false}
          animate="animate"
          className="text-center mb-12"
        >
          <motion.div
            variants={scaleIn}
            initial={false}
            animate="animate"
            className="inline-flex items-center justify-center w-20 h-20 bg-gold/10 rounded-full mb-6"
          >
            <Heart className="w-10 h-10 text-gold" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-ink mb-2">
            로그인
          </h1>
          <p className="text-ink/70 text-lg">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={getTransition('fast')}
            className="mb-6"
          >
            <Card className={`p-4 border-l-4 ${
              error.type === 'error' 
                ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
            }`}>
              <div className="flex items-start">
                <AlertCircle className={`w-5 h-5 mt-0.5 mr-3 ${
                  error.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm ${
                    error.type === 'error' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {error.message}
                  </p>
                  <button
                    onClick={clearError}
                    className={`text-xs mt-1 underline ${
                      error.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Social login buttons */}
        <motion.div
          variants={fadeInUp}
          initial={false}
          animate="animate"
          className="space-y-4"
        >
          {/* Google login */}
          <Button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading !== null}
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
            variant="outline"
          >
            {isLoading === 'google' ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google로 계속하기
          </Button>

          {/* Kakao login */}
          <Button
            onClick={() => handleSocialLogin('kakao')}
            disabled={isLoading !== null}
            className="w-full h-14 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] border-0"
          >
            {isLoading === 'kakao' ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
              </svg>
            )}
            카카오로 계속하기
          </Button>
        </motion.div>

        {/* Terms and privacy */}
        <motion.div
          variants={fadeInUp}
          initial={false}
          animate="animate"
          className="mt-8 text-center"
        >
          <p className="text-xs text-ink/50 leading-relaxed">
            계속 진행하면{" "}
            <button className="underline hover:text-ink/70">
              서비스 약관
            </button>
            과{" "}
            <button className="underline hover:text-ink/70">
              개인정보 처리방침
            </button>
            에 동의하는 것으로 간주됩니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
}