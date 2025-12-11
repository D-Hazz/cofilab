// cofilab-frontend/services/funding.ts
import { api } from "@/lib/api";
import axios from "axios"; 

// ---------- Types ----------
export interface FundingPayload {
  project_id: number;
  wallet_address: string;
  amount_sats: number;
  is_anonymous?: boolean;
  is_amount_public?: boolean;
}

// ---------- Services ----------

export async function createFunding(payload: FundingPayload) {
  return api("/payments/fund/", { method: "POST", body: JSON.stringify(payload) }).then((res: any) => res.data);
}

export async function payTask(payload: { task_id: number; user_id: number }) {
  return api("/payments/pay-task/", { method: "POST", body: JSON.stringify(payload) }).then((res: any) => res.data);
}

export async function verifyPayment(invoiceId: string) {
  return api(`/payments/verify-payment/${invoiceId}/`).then((res: any) => res.data);
}

export async function getFundingOptions(projectId: number) {
  return api(`/payments/funding-options/${projectId}/`).then((res: any) => res.data);
}

export async function getProjectFundings(projectId: number) {
  return api(`/payments/project-fundings/${projectId}/`).then((res: any) => res.data);
}

export async function getUserFundings(userId: number) {
  return api(`/payments/user-fundings/${userId}/`).then((res: any) => res.data);
}

export async function getFundingStatistics(projectId: number) {
  return api(`/payments/funding-statistics/${projectId}/`).then((res: any) => res.data);
}
