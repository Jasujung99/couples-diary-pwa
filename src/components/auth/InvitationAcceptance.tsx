"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Check, X, AlertCircle, Clock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface InvitationAcceptanceProps {
  token: string;
  onAccepted?: () => void;
  onRejected?: () => void;
}

interface InvitationDetails {
  id: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  expiresAt: string;
  status: string;
}

export function InvitationAcceptance({ token, onAccepted, onRejected }: InvitationAcceptanceProps) {
  const { acceptInvitation } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      setIsValidating(true);
      const response = await fetch(`/api/auth/invitation-details/${token}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "초대장을 찾을 수 없습니다");
      }

      const data = await response.json();
      setInvitationDetails(data.invitation);
    } catch (err: any) {
      setError(err.message || "초대장 확인에 실패했습니다");
    } finally {
      setIsValidating(false);
    }
  };

  const handleAccept = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await acceptInvitation(token);
      setSuccess(true);
      setPartnerInfo(result.partner);
      onAccepted?.();
    } catch (err: any) {
      setError(err.message || "초대 수락에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    // For now, just call the onRejected callback
    // In a full implementation, you might want to call an API to mark as rejected
    onRejected?.();
  };

  if (isValidating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-ink/70">초대장을 확인하고 있어요...</p>
        </Card>
      </motion.div>
    );
  }

  if (error && !invitationDetails) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-ink mb-2">
            초대장을 찾을 수 없어요
          </h3>
          
          <p className="text-ink/70 mb-6">
            {error}
          </p>

          <Button
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            홈으로 돌아가기
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (success && partnerInfo) {
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
            <Heart className="w-8 h-8 text-forest" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-ink mb-2">
            파트너 연결 완료!
          </h3>
          
          <p className="text-ink/70 mb-4">
            <span className="font-medium">{partnerInfo.name}</span>님과
            커플 다이어리를 시작해요
          </p>
          
          <div className="bg-ice p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center mb-2">
              <User className="w-5 h-5 text-ink/60 mr-2" />
              <span className="text-sm font-medium text-ink">파트너 정보</span>
            </div>
            <p className="text-sm text-ink/70">{partnerInfo.email}</p>
          </div>

          <Button
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            다이어리 시작하기
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (!invitationDetails) {
    return null;
  }

  const isExpired = new Date(invitationDetails.expiresAt) < new Date();
  const isAlreadyProcessed = invitationDetails.status !== 'pending';

  if (isExpired || isAlreadyProcessed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-ink mb-2">
            {isExpired ? "초대가 만료되었어요" : "이미 처리된 초대예요"}
          </h3>
          
          <p className="text-ink/70 mb-6">
            {isExpired 
              ? "이 초대는 만료되었습니다. 새로운 초대를 요청해주세요."
              : "이 초대는 이미 처리되었습니다."
            }
          </p>

          <Button
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            홈으로 돌아가기
          </Button>
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
            <Heart className="w-8 h-8 text-ink" />
          </div>
          
          <h2 className="text-2xl font-bold text-ink mb-2">
            파트너 초대
          </h2>
          
          <p className="text-ink/70">
            <span className="font-medium">{invitationDetails.inviterName}</span>님이
            커플 다이어리에 초대했어요
          </p>
        </div>

        <div className="bg-ice p-4 rounded-lg mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">초대한 사람:</span>
              <span className="font-medium text-ink">{invitationDetails.inviterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">이메일:</span>
              <span className="font-medium text-ink">{invitationDetails.inviterEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">만료일:</span>
              <span className="font-medium text-ink">
                {new Date(invitationDetails.expiresAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </motion.div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
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
                <Check className="w-4 h-4 mr-2" />
                초대 수락하기
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReject}
            variant="outline"
            disabled={isLoading}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            거절하기
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}