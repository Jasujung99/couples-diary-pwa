"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { fadeInUp, pageTransition, getTransition } from "@/utils/animations";
import { Heart, Calendar, Lock, Sparkles } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingPage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const onboardingPages: OnboardingPage[] = [
  {
    id: "welcome",
    title: "커플스 다이어리에 오신 것을 환영합니다",
    description: "사랑하는 사람과 함께 일상의 소중한 순간들을 기록하고 공유해보세요.",
    icon: <Heart className="w-16 h-16" />,
    color: "text-gold",
  },
  {
    id: "diary",
    title: "일기를 함께 써보세요",
    description: "매일의 생각과 감정을 서로 나누며 더 깊은 유대감을 만들어가세요.",
    icon: <Sparkles className="w-16 h-16" />,
    color: "text-mint",
  },
  {
    id: "dates",
    title: "데이트를 계획하고 추억을 만드세요",
    description: "특별한 날들을 함께 계획하고 소중한 추억들을 기록해보세요.",
    icon: <Calendar className="w-16 h-16" />,
    color: "text-lilac",
  },
  {
    id: "privacy",
    title: "안전하고 사적인 공간",
    description: "오직 두 사람만의 공간에서 안전하게 추억을 보관하세요.",
    icon: <Lock className="w-16 h-16" />,
    color: "text-forest",
  },
];

export function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextPage = () => {
    if (currentPage < onboardingPages.length - 1) {
      setDirection(1);
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageIndex: number) => {
    setDirection(pageIndex > currentPage ? 1 : -1);
    setCurrentPage(pageIndex);
  };

  const currentPageData = onboardingPages[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === onboardingPages.length - 1;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Skip button - only show on first page */}
      {isFirstPage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition('normal')}
          className="absolute top-6 right-6 z-10"
        >
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-ink/60 hover:text-ink"
          >
            건너뛰기
          </Button>
        </motion.div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Page indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={getTransition('normal')}
            className="flex justify-center mb-12"
          >
            <div className="flex space-x-2">
              {onboardingPages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentPage
                      ? "bg-gold w-8"
                      : "bg-line hover:bg-gold/50"
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Page content */}
          <div className="relative h-96 overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentPage}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={getTransition('normal')}
                className="absolute inset-0 flex flex-col items-center text-center"
              >
                {/* Icon */}
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  className={`mb-8 ${currentPageData.color}`}
                >
                  {currentPageData.icon}
                </motion.div>

                {/* Title */}
                <motion.h1
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  className="text-2xl font-bold text-ink mb-4 leading-tight"
                >
                  {currentPageData.title}
                </motion.h1>

                {/* Description */}
                <motion.p
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  className="text-ink/70 text-lg leading-relaxed"
                >
                  {currentPageData.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={getTransition('slow')}
            className="flex justify-between items-center mt-12"
          >
            <Button
              variant="ghost"
              onClick={prevPage}
              disabled={isFirstPage}
              className={`${isFirstPage ? "invisible" : ""}`}
            >
              이전
            </Button>

            <Button
              onClick={nextPage}
              className="px-8"
            >
              {isLastPage ? "시작하기" : "다음"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}