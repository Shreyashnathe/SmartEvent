export type LoginResponse = {
  token: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  codingPreference: number;
  communicationPreference: number;
};
