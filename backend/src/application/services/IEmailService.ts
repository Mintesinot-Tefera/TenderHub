export interface IEmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  sendBidSubmittedEmail(to: string, tenderTitle: string, tenderReference: string): Promise<void>;
  sendBidReviewedEmail(to: string, tenderTitle: string, status: 'ACCEPTED' | 'REJECTED'): Promise<void>;
}
