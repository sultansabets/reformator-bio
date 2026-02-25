import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return res.status(200).json({
    TEST: "API WORKS",
    time: new Date().toISOString(),
  });
}



