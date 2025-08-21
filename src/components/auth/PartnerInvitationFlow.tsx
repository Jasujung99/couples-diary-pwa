"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PartnerInvitation } from "./PartnerInvitation";
import { InvitationStatus } from "./InvitationStatus";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Users, Plus, List } from "lucide-react";

interface PartnerInvitationFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

type FlowStep = 'invite' | 'status' | 'complete';

export function PartnerInvitationFlow({ 
  onComplete, 
  onSkip, 
  showSkipOption = true 
}: PartnerInvitationFlowProps) {
  const { authState, invitePartner } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('invite');
  const [hasInvitations, setHasInvitations] = useState(false);

  useEffect(() => {
    // If user already has a partner, complete the flow
    if (authState.hasPartner) {
      setCurrentStep('complete');
      onComplete?.();
    }
  }, [authState.hasPartner, onComplete]);

  const handleInvitationSent = () => {
    setHasInvitations(true);
    setCurrentStep('status');
  };

  const handleResendInvitation = async (email: string) => {
    try {
      await invitePartner(email);
      // Refresh the status view
      setCurrentStep('status');
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const handleNewInvitation = () => {
    setCurrentStep('invite');
  };

  const handleViewStatus = () => {
    setCurrentStep('status');
  };

  if (authState.hasPartner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-6 text-center">
          <div className="w-16 h-16 bg-mint rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-forest" />
          </div>
          
          <h3 className="text-xl font-semibold text-ink mb-2">
            파트너와 연결됨
          </h3>
          
          <p className="text-ink/70 mb-4">
            <span className="font-medium">{authState.partner?.name}</span>님과
            함께 다이어리를 쓰고 있어요
          </p>

          <Button onClick={onComplete} className="w-full">
            다이어리 시작하기
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {currentStep === 'invite' && (
          <motion.div
            key="invite"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <PartnerInvitation
              onInvitationSent={handleInvitationSent}
              onSkip={showSkipOption ? onSkip : undefined}
            />
            
            {hasInvitations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-center"
              >
                <Button
                  onClick={handleViewStatus}
                  variant="ghost"
                  className="text-ink/60"
                >
                  <List className="w-4 h-4 mr-2" />
                  보낸 초대 확인하기
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {currentStep === 'status' && (
          <motion.div
            key="status"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <InvitationStatus
              onResendInvitation={handleResendInvitation}
              onCancelInvitation={() => {
                // Refresh the status view after cancellation
                setCurrentStep('status');
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 space-y-3"
            >
              <Button
                onClick={handleNewInvitation}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                새로운 초대 보내기
              </Button>
              
              {showSkipOption && onSkip && (
                <Button
                  onClick={onSkip}
                  variant="ghost"
                  className="w-full text-ink/60"
                >
                  나중에 초대하기
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}