export interface CreateMueRequest {
  code: string;
  name: string;
  description?: string | null;
  predominantControlType?: string | null;
  expectedMainEvidence?: string | null;
  isActive?: boolean;
}
