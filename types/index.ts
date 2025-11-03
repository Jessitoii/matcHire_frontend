export interface CV {
  id: string;
  name: string;
  file: File;
}

export interface JobDescription {
  title: string;
  description: string;
}

export interface SimilarityScore {
  cvId: string;
  score: number;
}

export interface SimilarityResponse {
  scores: SimilarityScore[];
}