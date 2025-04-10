// ./app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { randomUUID } from 'crypto';
import { SignJWT } from 'jose';
import { JWT } from 'next-auth/jwt';
import prisma from '@/app/backend/lib/prisma';

// Custom error class
class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | undefined;
    };
    access_token?: string;
    refresh_token?: string;
  }
}
// Extend the JWT interface
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    access_token?: string;
    refresh_token?: string;
    refresh_token_expires?: number;
  }
}

// Điều chỉnh interface DBUser để khớp với schema Prisma
interface DBUser {
  id: string; // Thay đổi từ number thành string vì id trong Prisma là UUID
  email: string;
  password: string;
  name?: string | null; // Prisma trả về null cho các trường optional
}

interface AuthUser extends User {
  id: string;
  email: string;
  name?: string;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new AuthError('Vui lòng nhập email và mật khẩu', 400);
          }

          // Sử dụng Prisma để truy vấn user thay vì query SQL
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          console.log('sssss', user);

          if (!user) {
            throw new AuthError('Không tìm thấy người dùng', 404);
          }

          const passwordCorrect = await compare(
            credentials.password,
            user.password
          );

          if (!passwordCorrect) {
            throw new AuthError('Mật khẩu không đúng', 401);
          }

          return {
            id: user.id, // id đã là string (UUID)
            email: user.email,
            name: user.name || undefined,
          };
        } catch (error) {
          if (error instanceof AuthError) {
            throw error;
          }
          console.error('Lỗi xác thực:', error);
          throw new AuthError('Lỗi xác thực', 500);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email as string;
        token.name = user.name as string;
        token.refresh_token = randomUUID();
        token.refresh_token_expires = Date.now() + 7 * 24 * 60 * 60 * 1000;

        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
        token.access_token = await new SignJWT({
          id: user.id,
          email: user.email,
          name: user.name,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(secret);
      }

      if (token.refresh_token_expires && Date.now() > token.refresh_token_expires) {
        console.log('Refresh token expired, needs renewal');
        throw new Error('Refresh token expired'); // Throw an error instead of returning null
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string | undefined,
        };
        session.access_token = token.access_token as string; // Now a proper JWT
        session.refresh_token = token.refresh_token as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log('User signed in:', user);
    },
    async signOut() {
      console.log('User signed out');
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };