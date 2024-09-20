import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://layerzero.foundation/api/proof/${address}`
    );
    const data = await response.json();
    // Only return the round2 allocation
    return NextResponse.json({ round2: data.round2 });
  } catch (error) {
    console.error("Error fetching allocation:", error);
    return NextResponse.json(
      { error: "Failed to fetch allocation" },
      { status: 500 }
    );
  }
}
