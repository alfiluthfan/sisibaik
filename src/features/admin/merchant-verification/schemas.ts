import { z } from "zod";

export const merchantReviewSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),

    rejectionReason: z
      .string()
      .trim()
      .max(500, "Alasan maksimal 500 karakter.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "rejected" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",

        path: ["rejectionReason"],

        message: "Alasan penolakan wajib diisi.",
      });
    }
  });
