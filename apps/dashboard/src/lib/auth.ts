import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text', placeholder: 'admin' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const adminUser = process.env['ADMIN_USER'];
        const adminPass = process.env['ADMIN_PASSWORD'];
        const clientId = process.env['CLIENT_ID'] ?? '00000000-0000-0000-0000-000000000099';
        
        // Single-Tenant aislado en Vercel (White-label)
        if (adminUser && adminPass && credentials?.username === adminUser && credentials?.password === adminPass) {
          return {
            id: '1',
            name: 'Equipo Aceros Temuco (Demo)',
            email: 'demo@example.com',
            clientId: clientId
          };
        }
        
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.clientId = user.clientId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.clientId = token.clientId;
      }
      return session;
    },
  },
};
