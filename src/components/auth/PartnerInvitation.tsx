"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Check, X, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface PartnerInvitationProps {
  onInvitationSent?: () => void;
  onSkip?: () => void;
}

export function PartnerInvitation({ onInvitationSent, onSkip }: PartnerInvitationProps) {
  const { invitePartner } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("이메일을 입력해주세요");
      return;
    }

    if (!validateEmail(email)) {
      setError("올바른 이메일 형식을 입력해주세요");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await invitePartner(email);
      setSuccess(true);
      setInvitationDetails(result.invitation);
      onInvitationSent?.();
    } catch (err: any) {
      setError(err.message || "초대 전송에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    setInvitationDetails(null);
  };

  if (success && invitationDetails) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-mint rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-8 h-8 text-forest" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-ink mb-2">
            초대를 보냈어요!
          </h3>
          
          <p className="text-ink/70 mb-4">
            <span className="font-medium">{invitationDetails.inviteeEmail}</span>에게
            파트너 초대를 보냈습니다
          </p>
          
          <div className="bg-ice p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center text-sm text-ink/60 mb-2">
              <Clock className="w-4 h-4 mr-2" />
              초대 만료일
            </div>
            <p className="text-sm font-medium text-ink">
              {new Date(invitationDetails.expiresAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
            >
              다른 이메일로 초대하기
            </Button>
            
            {onSkip && (
              <Button
                onClick={onSkip}
                variant="ghost"
                className="w-full text-ink/60"
              >
                나중에 초대하기
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-lilac rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-ink" />
          </div>
          
          <h2 className="text-2xl font-bold text-ink mb-2">
            파트너 초대하기
          </h2>
          
          <p className="text-ink/70">
            함께 일기를 쓸 파트너의 이메일을 입력해주세요
          </p>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="partner@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              className={error ? "border-red-500" : ""}
            />
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center mt-2 text-sm text-red-600"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </motion.div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                초대 보내기
              </>
            )}
          </Button>
        </form>

        {onSkip && (
          <div className="mt-4 text-center">
            <Button
              onClick={onSkip}
              variant="ghost"
              className="text-ink/60"
            >
              나중에 초대하기
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}