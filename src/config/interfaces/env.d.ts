export interface EnvVars {
    NODE_ENV: 'development' | 'qa' | 'production' | 'test';
    PORT: number;
    NATS_SERVER: string;
    DATABASE_URL: string;
}