import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      facebookId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    facebookId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}
