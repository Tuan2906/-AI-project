// pages/api/send-certificate.tsx
import { sendCertificateEmail } from '@/app/backend/lib/email';
import { NextResponse } from 'next/server';

// Define type for request body
interface SendCertificateRequestBody {
  email: string;
  recipientName: string;
  score: number;
  examId: string; // Thêm examId để tạo link đến trang reviewbaithi
}

// Function to validate email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// HTML email template for the certificate
const generateCertificateEmailTemplate = (recipientName: string, score: number, examId: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .certificate {
          border: 4px double #2c3e50;
          padding: 30px;
          max-width: 700px;
          margin: 20px auto;
          font-family: 'Open Sans';
          text-align: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          position: relative;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: -30px;
          left: -30px;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(44, 62, 80, 0.2), transparent);
          opacity: 0.3;
        }
        .certificate::after {
          content: '';
          position: absolute;
          bottom: -30px;
          right: -30px;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(44, 62, 80, 0.2), transparent);
          opacity: 0.3;
        }
        .logo {
          margin-bottom: 20px;
        }
        .logo img {
          max-width: 120px;
          height: auto;
          border-radius: 50%;
          border: 2px solid #2c3e50;
          padding: 5px;
          background: #fff;
        }
        .header {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          position: relative;
          display: inline-block;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 50%;
          height: 2px;
          background: linear-gradient(to right, transparent, #2c3e50, transparent);
        }
        .date {
          font-size: 16px;
          color: #555;
          margin-bottom: 20px;
          font-style: italic;
          background: rgba(255, 255, 255, 0.5);
          padding: 5px 15px;
          border-radius: 5px;
        }
        .recipient {
          font-size: 36px;
          font-weight: bold;
          color: #1a3c34;
          margin: 20px 0;
          text-transform: capitalize;
          border-bottom: 2px solid #1a3c34;
          display: inline-block;
          padding-bottom: 5px;
          background: rgba(255, 255, 255, 0.7);
          padding: 5px 20px;
          border-radius: 5px;
        }
        .course {
          font-size: 20px;
          color: #333;
          margin: 10px 0;
          line-height: 1.5;
          padding: 5px 15px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .score {
          font-size: 24px;
          color: #d35400;
          margin: 15px 0;
          font-weight: bold;
          background: #fff3e0;
          padding: 10px 20px;
          border-radius: 5px;
          display: inline-block;
          border: 1px dashed #d35400;
        }
        .review-link {
          margin: 20px 0;
          font-size: 18px;
        }
        .review-link a {
          color: #2980b9;
          text-decoration: none;
          font-weight: bold;
          padding: 8px 16px;
          border: 2px solid #2980b9;
          border-radius: 5px;
          transition: all 0.3s ease;
        }
        .review-link a:hover {
          background: #2980b9;
          color: #fff;
        }
        .issuer {
          font-size: 16px;
          color: #7f8c8d;
          margin-top: 20px;
          font-style: italic;
          padding: 5px 15px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 5px;
        }
        .signature {
          margin-top: 30px;
          font-size: 18px;
          color: #2980b9;
          font-style: italic;
          border-top: 1px solid #2980b9;
          padding-top: 10px;
          display: inline-block;
          position: relative;
        }
        .signature::before {
          content: '✦';
          position: absolute;
          left: -20px;
          top: 50%;
          transform: translateY(-50%);
          color: #2980b9;
          font-size: 14px;
        }
        .signature::after {
          content: '✦';
          position: absolute;
          right: -20px;
          top: 50%;
          transform: translateY(-50%);
          color: #2980b9;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="logo">
          <img src="https://cdn-icons-png.flaticon.com/512/1200/1200714.png" alt="Achievement Badge">
        </div>
        <div class="header">Test Result</div>
        <p class="date">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        <div class="recipient">${recipientName}</div>
        <div class="course">Congratulations! You have successfully completed the Session 2 assessment of the Basic ChatGPT Training Program.</div>
        <div class="score">Your score: ${score.toFixed(1)} / 10</div>
        <div class="review-link">
          <a href="https://ai-project-git-main-tuan2906s-projects.vercel.app/reviewbaithi/${examId}" target="_blank">Review your work</a>
        </div>
        <div class="issuer">Issued by</div>
        <div class="signature">Việt Nam Food Company.<br>Team AI</div>
      </div>
    </body>
    </html>
  `;
};

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, recipientName, score, examId }: SendCertificateRequestBody = await request.json();

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    if (!recipientName) {
      return NextResponse.json(
        { error: 'Tên người nhận là bắt buộc' },
        { status: 400 }
      );
    }

    if (score === undefined || score === null) {
      return NextResponse.json(
        { error: 'Điểm số là bắt buộc' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || score < 0 || score > 10) {
      return NextResponse.json(
        { error: 'Điểm số phải là một số từ 0 đến 10' },
        { status: 400 }
      );
    }

    if (!examId) {
      return NextResponse.json(
        { error: 'ID bài thi là bắt buộc' },
        { status: 400 }
      );
    }

    // Generate the email template with the recipient's name, score, and examId
    const emailTemplate = generateCertificateEmailTemplate(recipientName, score, examId);

    // Send the certificate email
    await sendCertificateEmail({
      to: email,
      subject: 'Chứng nhận hoàn thành khóa học buổi 2 từ AI',
      html: emailTemplate,
    });

    return NextResponse.json(
      {
        message: 'Chứng nhận đã được gửi đến email của bạn.',
        email: email,
        recipientName: recipientName,
        score: score,
        examId: examId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Lỗi khi gửi chứng nhận:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra trong quá trình gửi chứng nhận' },
      { status: 500 }
    );
  }
}