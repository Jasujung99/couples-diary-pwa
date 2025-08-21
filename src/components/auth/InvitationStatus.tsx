"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, Check, X, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Invitation {
  id: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt: string;
  createdAt: string;
  inviterName?: string;
}

interface InvitationStatusProps {
  onResendInvitation?: (email: string) => void;
  onCancelInvitation?: (id: string) => void;
}

export function InvitationStatus({ onResendInvitation, onCancelInvitation }: InvitationStatusProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/invitations");
      
      if (!response.ok) {
        throw new Error("초대 목록을 불러올 수 없습니다");
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err: any) {
      setError(err.message || "초대 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/auth/invitation/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("초대 취소에 실패했습니다");
      }

      // Remove from local state
      setInvitations(prev => prev.filter(inv => inv.id !== id));
      onCancelInvitation?.(id);
    } catch (err: any) {
      setError(err.message || "초대 취소에 실패했습니다");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gold" />;
      case 'accepted':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Mail className="w-4 h-4 text-ink/60" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'accepted':
        return '수락됨';
      case 'rejected':
        return '거절됨';
      default:
        return '알 수 없음';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gold';
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-ink/60';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
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
            className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-ink/70">초대 상태를 확인하고 있어요...</p>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchInvitations} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (invitations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-6 text-center">
          <Mail className="w-12 h-12 text-ink/30 mx-auto mb-4" />
          <p className="text-ink/70">보낸 초대가 없어요</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      <h3 className="text-lg font-semibold text-ink mb-4">보낸 초대</h3>
      
      {invitations.map((invitation, index) => (
        <motion.div
          key={invitation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {getStatusIcon(invitation.status)}
                  <span className={`ml-2 text-sm font-medium ${getStatusColor(invitation.status)}`}>
                    {getStatusText(invitation.status)}
                  </span>
                  {isExpired(invitation.expiresAt) && invitation.status === 'pending' && (
                    <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      만료됨
                    </span>
                  )}
                </div>
                
                <p className="text-ink font-medium mb-1">
                  {invitation.inviteeEmail}
                </p>
                
                <div className="text-xs text-ink/60 space-y-1">
                  <p>
                    보낸 날짜: {new Date(invitation.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                  <p>
                    만료일: {new Date(invitation.expiresAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {invitation.status === 'pending' && (
                  <>
                    {isExpired(invitation.expiresAt) && onResendInvitation && (
                      <Button
                        onClick={() => onResendInvitation(invitation.inviteeEmail)}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        재전송
                      </Button>
                    )}
                    
                    {onCancelInvitation && (
                      <Button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        size="sm"
                        variant="ghost"
                        className="text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        취소
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}