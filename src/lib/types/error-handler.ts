export interface IActionState {
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
  data?: Record<string, string>;
}
