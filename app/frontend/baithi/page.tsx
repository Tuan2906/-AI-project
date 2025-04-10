"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import questionsData from "./data.json";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

const checkExamEligibility = async (userData: { email: string; hoTen: string; phongBan: string; ngayVaoThi: string }) => {
  const response = await fetch("/api/checkbaithi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: userData.email,
      hoTen: userData.hoTen,
      phongBan: userData.phongBan,
      ngayVaoThi: userData.ngayVaoThi, // Gửi thời gian local
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Lỗi khi kiểm tra điều kiện thi");
  }

  return response.json();
};

const submitExam = async (examData: {
  email: string;
  hoTen: string;
  phongBan: string;
  diem: number;
  soCauDung: number;
  cauHoi: any[];
  ngayNop: string;
}) => {
  const response = await fetch("/api/saveexam", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: examData.email,
      hoTen: examData.hoTen,
      phongBan: examData.phongBan,
      diem: examData.diem,
      soCauDung: examData.soCauDung,
      cauHoi: examData.cauHoi,
      ngayNop: examData.ngayNop,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Lỗi khi cập nhật bài thi");
  }

  return response.json();
};

const sendCertificateViaApi = async (certificateData: { email: string; recipientName: string; score: number }) => {
  const response = await fetch("/api/sendcertificate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: certificateData.email,
      recipientName: certificateData.recipientName,
      score: certificateData.score,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Lỗi khi gửi chứng nhận qua API");
  }

  return response.json();
};

export default function Home() {
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phongBan: "" });
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [answers, setAnswers] = useState<string[]>(Array(20).fill(""));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [eligibilityMessage, setEligibilityMessage] = useState<string>("");
  const [isFullyCompleted, setIsFullyCompleted] = useState(false);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const checkEligibilityMutation = useMutation({
    mutationFn: checkExamEligibility,
    onSuccess: (data) => {
      if (data.eligible) {
        const shuffled = shuffleArray(questionsData);
        const selectedQuestions = shuffled.slice(0, 20);
        setShuffledQuestions(selectedQuestions);
        setAnswers(Array(selectedQuestions.length).fill(""));
        setIsStarted(true);
        setEligibilityMessage("");
      } else {
        setEligibilityMessage(
          "Bạn đã thực hiện bài thi trong ngày hôm nay. Vui lòng thử lại vào ngày mai!"
        );
      }
    },
    onError: (error) => {
      console.error("Lỗi khi kiểm tra điều kiện thi:", error.message);
      setEligibilityMessage(`Lỗi: ${error.message}`);
    },
  });

  const sendCertificateMutation = useMutation({
    mutationFn: sendCertificateViaApi,
    onSuccess: (data) => {
      console.log("Certificate sent successfully via API:", data);
      setEligibilityMessage("Chứng nhận đã được gửi đến email của bạn!");
      setIsFullyCompleted(true);
    },
    onError: (error) => {
      console.error("Error sending certificate via API:", error.message);
      setEligibilityMessage(`Lỗi khi gửi chứng nhận: ${error.message}`);
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitExam,
    onSuccess: (data) => {
      console.log("Cập nhật bài thi thành công:", data);
      const { score } = calculateResult();
      sendCertificateMutation.mutate({
        email: userInfo.email,
        recipientName: userInfo.name,
        score: score,
      });
    },
    onError: (error) => {
      console.error("Lỗi khi cập nhật bài thi:", error.message);
      setEligibilityMessage(`Lỗi: ${error.message}`);
    },
  });

  useEffect(() => {
    if (isStarted && timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [isStarted, timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
  };

  const handleStart = () => {
    if (userInfo.name && userInfo.email && userInfo.phongBan) {
      setEligibilityMessage("");
      const localDate = new Date();
      checkEligibilityMutation.mutate({
        email: userInfo.email,
        hoTen: userInfo.name,
        phongBan: userInfo.phongBan,
        ngayVaoThi: localDate.toString(), // Gửi thời gian local dưới dạng chuỗi
      });
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const calculateResult = () => {
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer === shuffledQuestions[index].correct) {
        correctCount++;
      }
    });
    const score = (correctCount / shuffledQuestions.length) * 10;
    return { correctCount, score };
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const { correctCount, score } = calculateResult();

    const examData = {
      email: userInfo.email,
      hoTen: userInfo.name,
      phongBan: userInfo.phongBan,
      diem: score,
      soCauDung: correctCount,
      cauHoi: shuffledQuestions.map((q, index) => ({
        id: q.id,
        noiDung: q.question,
        dapAn: answers[index] || "",
        dapAnDung: q.correct,
      })),
      ngayNop: new Date().toString(), // Gửi thời gian local
    };

    submitMutation.mutate(examData);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Thông tin thí sinh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Họ và tên"
              value={userInfo.name}
              onChange={(e) =>
                setUserInfo({ ...userInfo, name: e.target.value })
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={userInfo.email}
              onChange={(e) =>
                setUserInfo({ ...userInfo, email: e.target.value })
              }
            />
            <Input
              placeholder="Phòng ban"
              value={userInfo.phongBan}
              onChange={(e) =>
                setUserInfo({ ...userInfo, phongBan: e.target.value })
              }
            />
            <div className="flex justify-end">
              <Button
                onClick={handleStart}
                disabled={
                  !userInfo.name ||
                  !userInfo.email ||
                  !userInfo.phongBan ||
                  checkEligibilityMutation.isPending
                }
              >
                {checkEligibilityMutation.isPending ? (
                  <span>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 inline-block"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang kiểm tra...
                  </span>
                ) : (
                  "Vào thi"
                )}
              </Button>
            </div>
            {eligibilityMessage && (
              <p
                className={`text-sm ${
                  eligibilityMessage.includes("Lỗi")
                    ? "text-red-500"
                    : "text-yellow-600"
                }`}
              >
                {eligibilityMessage}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted && !showReview) {
    const { correctCount, score } = calculateResult();
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Kết quả bài thi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Họ tên: {userInfo.name}</p>
            <p>Email: {userInfo.email}</p>
            <p>Phòng ban: {userInfo.phongBan}</p>
            <p>
              Số câu đúng: {correctCount}/{shuffledQuestions.length}
            </p>
            <p>Điểm: {score.toFixed(1)}</p>
            {submitMutation.isPending && <p>Đang cập nhật bài thi...</p>}
            {submitMutation.isError && (
              <p className="text-red-500">
                Lỗi: {submitMutation.error?.message || "Không thể cập nhật bài thi"}
              </p>
            )}
            {submitMutation.isSuccess && (
              <>
                <p className="text-green-500">Đã cập nhật bài thi thành công!</p>
                {sendCertificateMutation.isPending && <p>Đang gửi chứng nhận...</p>}
                {sendCertificateMutation.isError && (
                  <p className="text-red-500">
                    Lỗi: {sendCertificateMutation.error?.message || "Không thể gửi chứng nhận"}
                  </p>
                )}
                {sendCertificateMutation.isSuccess && (
                  <p className="text-green-500">Chứng nhận đã được gửi đến email của bạn!</p>
                )}
              </>
            )}
            {isFullyCompleted && (
            <div className="flex flex-col items-center gap-3 mt-4"> {/* Sử dụng flex để canh giữa và điều chỉnh khoảng cách */}
            <Button onClick={() => setShowReview(true)} className="w-full max-w-xs py-2"> {/* Giới hạn chiều rộng và padding */}
              Xem lại bài làm
            </Button>
            <Link href="/login" className="w-full max-w-xs">
              <Button variant="outline" className="w-full py-2"> {/* Giới hạn chiều rộng và padding */}
                Quay về trang chủ
              </Button>
            </Link>
          </div>
          )}
           
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted && showReview) {
    return (
      <div className="min-h-screen p-4 flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Xem lại bài làm</CardTitle>
          </CardHeader>
          <CardContent>
            {shuffledQuestions.map((q, index) => {
              const isCorrect = answers[index] === q.correct;
              return (
                <div
                  key={q.id}
                  className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50"
                >
                  <p className="font-semibold text-gray-800">
                    Câu {index + 1}: {q.question}
                  </p>
                  <div className="space-y-2 mt-2">
                    {q.options.map((option: any, optIndex: any) => {
                      const isSelected = answers[index] === option;
                      const isCorrectAnswer = option === q.correct;
                      let className = "flex items-center p-2 rounded cursor-pointer";
                      if (isSelected && isCorrect) {
                        className += " bg-green-100 border border-green-500";
                      } else if (isSelected && !isCorrect) {
                        className += " bg-red-100 border border-red-500";
                      } else if (!isSelected && isCorrectAnswer) {
                        className += " bg-green-100 border border-green-500";
                      }

                      return (
                        <label key={optIndex} className={className}>
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={isSelected}
                            disabled
                            className="mr-2"
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowReview(false)}>
                Quay lại kết quả
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Bài thi trắc nghiệm</CardTitle>
          <p className={timeLeft <= 60 ? "text-red-500" : "text-black"}>
            Thời gian còn lại: {formatTime(timeLeft)}
          </p>
        </CardHeader>
        <CardContent>
          {shuffledQuestions.map((q, index) => (
            <div
              key={q.id}
              className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50"
            >
              <p className="font-semibold text-gray-800">
                Câu {index + 1}: {q.question}
              </p>
              <div className="space-y-2 mt-2">
                {q.options.map((option: any, optIndex: any) => (
                  <label
                    key={optIndex}
                    className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={answers[index] === option}
                      onChange={() => handleAnswerChange(index, option)}
                      disabled={isSubmitted}
                      className="mr-2"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit} disabled={isSubmitted}>
              Nộp bài
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}