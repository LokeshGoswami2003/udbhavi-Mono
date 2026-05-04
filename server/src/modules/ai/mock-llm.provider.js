export async function callMockResumeProvider({ draft, feedback, nextAction }) {
  return {
    resumeDraft: draft,
    feedback,
    nextAction,
  };
}
