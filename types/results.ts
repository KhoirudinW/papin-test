export type TestResultRow = {
  id: string;
  profile_id: string;
  test_slug: string;
  variant: string | null;
  score_data: any;
  answers: any;
  created_at: string;
};

export type SaveTestResultPayload = {
  test_slug: string;
  variant?: string;
  score_data: any;
  answers: any;
};

export type HistoryApiResponse = {
  results: TestResultRow[];
};
