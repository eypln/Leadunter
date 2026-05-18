import { NextAuthOptions } from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import { supabaseAdmin } from '@/lib/supabase/client';

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      try {
        // Check if user exists in Supabase
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (!existingUser) {
          // Create new user in Supabase
          await supabaseAdmin.from('users').insert({
            facebook_id: account?.providerAccountId || user.id,
            email: user.email,
            name: user.name || 'Unknown',
            avatar_url: user.image,
          });
        } else {
          // Update existing user
          await supabaseAdmin
            .from('users')
            .update({
              name: user.name || existingUser.name,
              avatar_url: user.image || existingUser.avatar_url,
            })
            .eq('email', user.email);
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },

    async session({ session }) {
      if (session.user && session.user.email) {
        // Add user ID from database to session
        try {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, facebook_id')
            .eq('email', session.user.email)
            .single();

          if (user) {
            session.user.id = user.id;
            session.user.facebookId = user.facebook_id;
          }
        } catch (error) {
          console.error('Error in session callback:', error);
        }
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
