import { DefaultSession } from "next-auth";
import { Role } from "@/types/api";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      phone?: string;
      role: Role;
    };
    token?: string;
  }

  interface User {
    phone?: string;
    role?: Role;
    token?: string;
    fullname?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    phone?: string;
    role?: Role;
    token?: string;
    fullname?: string;
  }
}
