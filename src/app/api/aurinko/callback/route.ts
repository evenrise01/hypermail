// /api/aurinko/callback

import { waitUntil } from "@vercel/functions";
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const GET = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;

  const status = params.get("status");
  if (status !== "success") {
    return NextResponse.json(
      { message: "Failed to link an account" },
      { status: 400 },
    );
  }

  //Get the code to exchange for the aurinko token
  const code = params.get("code");
  if (!code) {
    return NextResponse.json({ message: "No code provided" }, { status: 400 });
  }
  const token = await exchangeCodeForAccessToken(code);
  if (!token) {
    return NextResponse.json(
      { message: "Failed to exchange code for a token" },
      { status: 400 },
    );
  }

  const accountDetails = await getAccountDetails(token.accessToken);

  await db.account.upsert({
    where: {
      id: token.accountId.toString(),
    },
    update: {
      accessToken: token.accessToken,
    },
    create: {
      id: token.accountId.toString(),
      userId,
      emailAddress: accountDetails.email,
      name: accountDetails.name,
      accessToken: token.accessToken,
    },
  });

  //trigger initial sync endpoint
  waitUntil(
    axios
      .post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
        accountId: token.accountId.toString(),
        userId,
      })
      .then((response) => {
        console.log("Initial Sync triggered", response.data);
      })
      .catch((error) => {
        console.log("Failed to trigger initial sync", error.response.data);
      }),
  );

  //Return the user to the mail dashboard since they have successfully connected their account
  return NextResponse.redirect(new URL("/mail", req.url));
};
