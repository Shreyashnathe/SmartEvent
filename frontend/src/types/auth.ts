export type LoginResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  data?: {
    token?: string;
    accessToken?: string;
    jwt?: string;
  };
};

export type RegisterRequest = {
  email: string;
  password: string;
  codingPreference: number;
  communicationPreference: number;
};
