// cofilab-frontend/hooks/useFunding.ts
import { useState } from "react";
import { createFunding, FundingPayload } from "@/services/funding";

export function useFunding() {
  const [loading, setLoading] = useState(false);

  async function fundProject(data: FundingPayload) {
    setLoading(true);
    try {
      return await createFunding(data);
    } finally {
      setLoading(false);
    }
  }

  return { fundProject, loading };
}
