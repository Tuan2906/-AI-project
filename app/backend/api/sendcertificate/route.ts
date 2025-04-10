import { sendCertificateEmail } from '@/app/backend/lib/email';
import { NextResponse } from 'next/server';

// Define type for request body
interface SendCertificateRequestBody {
  email: string;
  recipientName: string;
  score: number; // Add score field
}

// Function to validate email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// HTML email template for the certificate
const generateCertificateEmailTemplate = (recipientName: string, score: number): string => {
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
          font-family: 'Georgia', serif;
          text-align: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .header {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .date {
          font-size: 16px;
          color: #555;
          margin-bottom: 20px;
          font-style: italic;
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
        }
        .course {
          font-size: 20px;
          color: #333;
          margin: 10px 0;
          line-height: 1.5;
        }
        .score {
          font-size: 24px;
          color: #d35400;
          margin: 15px 0;
          font-weight: bold;
          background: #fff3e0;
          padding: 10px;
          border-radius: 5px;
          display: inline-block;
        }
        .issuer {
          font-size: 16px;
          color: #7f8c8d;
          margin-top: 20px;
          font-style: italic;
        }
        .signature {
          margin-top: 30px;
          font-size: 18px;
          color: #2980b9;
          font-style: italic;
          border-top: 1px solid #2980b9;
          padding-top: 10px;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">AI Certificate</div>
        <p class="date">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        <div class="recipient">${recipientName}</div>
        <div class="course">has successfully completed Session 2 of the course</div>
        <div class="course">Utilized ChatGPT for creating marketing content and partner emails</div>
        <div class="course">Utilized ChatGPT for generating images, videos, and extracting subtitles</div>
        <div class="score">Score: ${score.toFixed(1)} / 10</div>
        <div class="issuer">Issued by</div>
        <div class="signature">Công ty Cổ Phần Việt Nam Food<br>Team AI</div>
      </div>
    </body>
    </html>
  `;
};

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, recipientName, score }: SendCertificateRequestBody = await request.json();

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

    // Generate the email template with the recipient's name and score
    const emailTemplate = generateCertificateEmailTemplate(recipientName, score);

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