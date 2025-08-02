export interface RequestPayload {
    userId: string;
    data: any;
}

export interface ResponseData {
    success: boolean;
    message: string;
    data?: any;
}