import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER", // Default role
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "User created successfully" 
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { message: "Failed to create account" },
      { status: 500 }
    );
  }
}
