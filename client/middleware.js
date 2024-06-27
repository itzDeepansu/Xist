
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token }) => {
      // If there is a token, the user is authenticated
      return !!token;
    },
  },
});

// Specify the matcher to protect specific routes
export const config = {
  matcher: ['/'],
};