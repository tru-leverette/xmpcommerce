export type Game = {
    id: string;
    title: string;
    status: string;
    minScavengerStones?: number;
    phase?: string;
    [key: string]: unknown;
};