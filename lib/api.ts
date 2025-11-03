const uploadCVsAndJobDescription = async (cvs: File[], jobDescription: string) => {
  const formData = new FormData();
    cvs.forEach((cv) => {
    formData.append("cvs", cv);
  });
  formData.append("jobDescription", jobDescription);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload CVs and job description");
  }

  return response.json();
};

const fetchSimilarityScores = async () => {
  const response = await fetch("/api/similarity-scores");
  if (!response.ok) {
    throw new Error("Failed to fetch similarity scores");
  }
  return response.json();
};

export { uploadCVsAndJobDescription, fetchSimilarityScores };   