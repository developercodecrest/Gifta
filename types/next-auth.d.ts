import { DefaultSession } from "next-auth";
import { Role } from "@/types/api";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
    };
  }

  interface User {
    role?: Role;
  }
}
